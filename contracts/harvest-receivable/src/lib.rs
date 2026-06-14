#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, Env, String, Vec,
};

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum Status {
    Created,
    Funded,
    Repaid,
    Defaulted,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Receivable {
    pub id: u64,
    pub farmer: Address,
    pub crop_type: String,
    pub estimated_yield_kg: u64,
    pub estimated_value: i128,   // in stroops
    pub harvest_date: u64,       // unix timestamp
    pub discount_rate_bps: u32,  // basis points, e.g. 800 = 8%
    pub status: Status,
    pub funded_amount: i128,
    pub investor: Option<Address>,
    pub created_at: u64,
}

const GRACE_PERIOD: u64 = 7 * 24 * 3600; // 7 days in seconds

fn load(env: &Env, id: u64) -> Receivable {
    env.storage().persistent().get(&id).expect("not found")
}

fn save(env: &Env, r: &Receivable) {
    env.storage().persistent().set(&r.id, r);
}

fn next_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .instance()
        .get(&symbol_short!("next_id"))
        .unwrap_or(0u64);
    env.storage()
        .instance()
        .set(&symbol_short!("next_id"), &(id + 1));
    id
}

#[contract]
pub struct HarvestReceivable;

#[contractimpl]
impl HarvestReceivable {
    pub fn create_receivable(
        env: Env,
        farmer: Address,
        crop_type: String,
        estimated_yield_kg: u64,
        estimated_value: i128,
        harvest_date: u64,
        discount_rate_bps: u32,
    ) -> u64 {
        farmer.require_auth();
        let id = next_id(&env);
        save(
            &env,
            &Receivable {
                id,
                farmer,
                crop_type,
                estimated_yield_kg,
                estimated_value,
                harvest_date,
                discount_rate_bps,
                status: Status::Created,
                funded_amount: 0,
                investor: None,
                created_at: env.ledger().timestamp(),
            },
        );
        id
    }

    pub fn fund_receivable(env: Env, investor: Address, receivable_id: u64, amount: i128) {
        investor.require_auth();
        let mut r = load(&env, receivable_id);
        assert!(r.status == Status::Created, "not fundable");
        r.status = Status::Funded;
        r.funded_amount = amount;
        r.investor = Some(investor);
        save(&env, &r);
    }

    pub fn repay_receivable(env: Env, farmer: Address, receivable_id: u64, amount: i128) {
        farmer.require_auth();
        let mut r = load(&env, receivable_id);
        assert!(r.status == Status::Funded, "not funded");
        assert!(r.farmer == farmer, "not your receivable");
        let yield_amount = r.funded_amount * r.discount_rate_bps as i128 / 10_000;
        let required = r.funded_amount + yield_amount;
        assert!(amount >= required, "insufficient repayment");
        r.status = Status::Repaid;
        save(&env, &r);
    }

    pub fn mark_defaulted(env: Env, receivable_id: u64) {
        let mut r = load(&env, receivable_id);
        assert!(r.status == Status::Funded, "not funded");
        let deadline = r.harvest_date + GRACE_PERIOD;
        assert!(env.ledger().timestamp() > deadline, "grace period active");
        r.status = Status::Defaulted;
        save(&env, &r);
    }

    pub fn get_receivable(env: Env, id: u64) -> Receivable {
        load(&env, id)
    }

    pub fn list_receivables_by_status(env: Env, status: Status) -> Vec<Receivable> {
        let count: u64 = env
            .storage()
            .instance()
            .get(&symbol_short!("next_id"))
            .unwrap_or(0);
        let mut result = vec![&env];
        for i in 0..count {
            if let Some(r) = env.storage().persistent().get::<u64, Receivable>(&i) {
                if r.status == status {
                    result.push_back(r);
                }
            }
        }
        result
    }
}

#[cfg(test)]
mod test;
