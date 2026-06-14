#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Env, String,
};

fn setup() -> (Env, HarvestReceivableClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register_contract(None, HarvestReceivable);
    let client = HarvestReceivableClient::new(&env, &id);
    (env, client)
}

#[test]
fn test_create_and_fund() {
    let (env, client) = setup();
    let farmer = Address::generate(&env);
    let investor = Address::generate(&env);

    let id = client.create_receivable(
        &farmer,
        &String::from_str(&env, "Maize"),
        &1000u64,
        &10_000_000i128,
        &(env.ledger().timestamp() + 90 * 86400),
        &800u32,
    );

    assert_eq!(id, 0);
    assert_eq!(client.get_receivable(&id).status, Status::Created);

    client.fund_receivable(&investor, &id, &9_200_000i128);
    let r = client.get_receivable(&id);
    assert_eq!(r.status, Status::Funded);
    assert_eq!(r.funded_amount, 9_200_000i128);
}

#[test]
fn test_repayment_yield_math() {
    let (env, client) = setup();
    let farmer = Address::generate(&env);
    let investor = Address::generate(&env);

    let id = client.create_receivable(
        &farmer,
        &String::from_str(&env, "Wheat"),
        &500u64,
        &5_000_000i128,
        &(env.ledger().timestamp() + 60 * 86400),
        &1000u32, // 10%
    );

    // fund at discounted price
    client.fund_receivable(&investor, &id, &4_545_455i128);
    // required = 4_545_455 + 10% = 4_545_455 + 454_545 = 5_000_000
    client.repay_receivable(&farmer, &id, &5_000_001i128);
    assert_eq!(client.get_receivable(&id).status, Status::Repaid);
}

#[test]
#[should_panic(expected = "insufficient repayment")]
fn test_repayment_insufficient() {
    let (env, client) = setup();
    let farmer = Address::generate(&env);
    let investor = Address::generate(&env);

    let id = client.create_receivable(
        &farmer,
        &String::from_str(&env, "Rice"),
        &200u64,
        &2_000_000i128,
        &(env.ledger().timestamp() + 45 * 86400),
        &500u32, // 5%
    );
    client.fund_receivable(&investor, &id, &1_900_000i128);
    // required = 1_900_000 + 5% = 1_995_000; paying 1_800_000 must panic
    client.repay_receivable(&farmer, &id, &1_800_000i128);
}

#[test]
fn test_default_logic() {
    let (env, client) = setup();
    let farmer = Address::generate(&env);
    let investor = Address::generate(&env);

    let harvest_date = env.ledger().timestamp() + 30 * 86400;
    let id = client.create_receivable(
        &farmer,
        &String::from_str(&env, "Sorghum"),
        &300u64,
        &3_000_000i128,
        &harvest_date,
        &600u32,
    );
    client.fund_receivable(&investor, &id, &2_820_000i128);

    // advance past harvest_date + 7-day grace period
    env.ledger().with_mut(|l| {
        l.timestamp = harvest_date + 8 * 86400;
    });

    client.mark_defaulted(&id);
    assert_eq!(client.get_receivable(&id).status, Status::Defaulted);
}

#[test]
#[should_panic(expected = "grace period active")]
fn test_default_before_grace_period() {
    let (env, client) = setup();
    let farmer = Address::generate(&env);
    let investor = Address::generate(&env);

    let harvest_date = env.ledger().timestamp() + 30 * 86400;
    let id = client.create_receivable(
        &farmer,
        &String::from_str(&env, "Cassava"),
        &400u64,
        &4_000_000i128,
        &harvest_date,
        &700u32,
    );
    client.fund_receivable(&investor, &id, &3_720_000i128);
    client.mark_defaulted(&id); // still within grace period — must panic
}
