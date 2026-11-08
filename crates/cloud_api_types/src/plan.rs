use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Plan {
    #[default]
    Recode,
    ZedFree,
    ZedPro,
    ZedProTrial,
    ZedBusiness,
    ZedVip,
    ZedStudent,
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
