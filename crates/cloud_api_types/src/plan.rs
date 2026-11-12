use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Plan {
    #[default]
    Recode,
    RecodeFree,
    RecodePro,
    RecodeProTrial,
    RecodeBusiness,
    RecodeVip,
    RecodeStudent,
}

#[derive(Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct PlanInfo {
    pub is_account_too_young: bool,
    pub has_overdue_invoices: bool,
}

impl PlanInfo {
    pub fn plan(&self) -> Plan {
        Plan::Recode
    }
}
