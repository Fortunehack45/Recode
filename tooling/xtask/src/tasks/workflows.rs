use anyhow::{Context, Result};
use clap::Parser;
use gh_workflow::Workflow;
use std::fs;
use std::path::{Path, PathBuf};
use strum::IntoEnumIterator;

use crate::tasks::workflow_checks::{self};

mod bump_patch_version;
mod bump_recode_version;
mod nix_build;
mod release;
mod release_nightly;
mod run_bundling;
mod run_tests;
mod runners;
mod steps;
mod vars;

#[derive(Clone)]
pub(crate) struct GitSha(String);

impl AsRef<str> for GitSha {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl std::str::FromStr for GitSha {
    type Err = String;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        const GIT_SHA_LENGTH: usize = 40;
        if value.len() != GIT_SHA_LENGTH {
            return Err(format!(
                "Git SHA has wrong length! \
                Only SHAs with a full length of {GIT_SHA_LENGTH} are supported, found {len} characters.",
                len = value.len()
            ));
        }
        if !value.bytes().all(|byte| byte.is_ascii_hexdigit()) {
            return Err("Not a valid Git SHA".to_owned());
        }
        Ok(Self(value.to_owned()))
    }
}

#[allow(
    clippy::disallowed_methods,
    reason = "This runs only in a CLI environment"
)]
fn parse_ref(value: &str) -> Result<GitSha, String> {
    let sha = value.parse::<GitSha>()?;
    let output = std::process::Command::new("git")
        .args([
            "rev-parse",
            "--quiet",
            "--verify",
            &format!("{}^{{commit}}", sha.as_ref()),
        ])
        .output()
        .map_err(|_| "Failed to spawn Git command to verify SHA".to_owned())?;
    if !output.status.success() {
        return Err(format!(
            "SHA {} is not a valid Git SHA within this repository!",
            sha.as_ref()
        ));
    }
    Ok(sha)
}

#[derive(Parser)]
pub(crate) struct GenerateWorkflowArgs {
    #[arg(value_parser = parse_ref)]
    /// The Git SHA to use when invoking this
    pub(crate) sha: Option<GitSha>,
}

enum WorkflowSource {
    Contextless(fn() -> Workflow),
}

struct WorkflowFile {
    source: WorkflowSource,
    r#type: WorkflowType,
}

impl WorkflowFile {
    fn recode(f: fn() -> Workflow) -> WorkflowFile {
        WorkflowFile {
            source: WorkflowSource::Contextless(f),
            r#type: WorkflowType::Recode,
        }
    }

    fn generate_file(&self, _workflow_args: &GenerateWorkflowArgs) -> Result<()> {
        let workflow = match &self.source {
            WorkflowSource::Contextless(f) => f(),
        };
        let workflow_folder = self.r#type.folder_path();

        fs::create_dir_all(&workflow_folder).with_context(|| {
            format!("Failed to create directory: {}", workflow_folder.display())
        })?;

        let workflow_name = workflow
            .name
            .as_ref()
            .expect("Workflow must have a name at this point");
        let filename = format!(
            "{workflow_name}.yml",
            workflow_name = workflow_name.rsplit("::").next().unwrap_or(workflow_name)
        );

        let workflow_path = workflow_folder.join(filename);

        let content = workflow
            .to_string()
            .map_err(|e| anyhow::anyhow!("{:?}: {:?}", workflow_path, e))?;

        let disclaimer = self.r#type.disclaimer(workflow_name);

        let content = [disclaimer, content].join("\n");
        fs::write(&workflow_path, content).map_err(Into::into)
    }
}

#[derive(PartialEq, Eq, strum::EnumIter)]
pub enum WorkflowType {
    /// Workflows living in the Recode repository
    Recode,
}

impl WorkflowType {
    const PREAMBLE: &str = "# Generated from xtask::workflows::";

    fn disclaimer(&self, workflow_name: &str) -> String {
        format!(
            concat!(
                "{preamble}{workflow_name}\n",
                "# Rebuild with `cargo xtask workflows`.",
            ),
            preamble = Self::PREAMBLE,
            workflow_name = workflow_name,
        )
    }

    pub fn folder_path(&self) -> PathBuf {
        match self {
            WorkflowType::Recode => PathBuf::from(".github/workflows"),
        }
    }

    fn remove_generated_workflows() -> Result<()> {
        for workflow_type in Self::iter() {
            for path in fs::read_dir(workflow_type.folder_path())? {
                let entry = path?;
                if !entry.file_type().is_ok_and(|file_type| file_type.is_file()) {
                    continue;
                }

                let path = entry.path();
                if fs::read_to_string(&path)
                    .is_ok_and(|content| content.starts_with(Self::PREAMBLE))
                {
                    fs::remove_file(path)?;
                }
            }
        }

        Ok(())
    }
}

pub fn run_workflows(args: GenerateWorkflowArgs) -> Result<()> {
    if !Path::new("crates/recode/").is_dir() {
        anyhow::bail!("xtask workflows must be ran from the project root");
    }

    // Remove all previously generated workflows to ensure these do not become stale.
    WorkflowType::remove_generated_workflows()?;

    let workflows = [
        WorkflowFile::recode(bump_patch_version::bump_patch_version),
        WorkflowFile::recode(bump_recode_version::bump_recode_version),
        WorkflowFile::recode(nix_build::nix_build),
        WorkflowFile::recode(release::release),
        WorkflowFile::recode(release_nightly::release_nightly),
        WorkflowFile::recode(run_bundling::run_bundling),
        WorkflowFile::recode(run_tests::run_tests),
    ];

    for workflow_file in workflows {
        workflow_file.generate_file(&args)?;
    }

    workflow_checks::validate(Default::default())
}
