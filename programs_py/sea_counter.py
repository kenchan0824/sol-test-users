# sea_counter
# Built with Seahorse v0.2.0

from seahorse.prelude import *

declare_id('7vwrU2qgvtHuWgXsSyzfH8iBzztHpKbe2gVDXz18aNUR')

class Counter(Account):
    owner: Pubkey
    count: u16

@instruction
def init_counter(owner: Signer, counter: Empty[Counter]):
    counter = counter.init(
        payer = owner,
        seeds = ["counter", owner]
    )
    counter.owner = owner.key()
    counter.count = 0

@instruction
def increase(owner: Signer, counter: Counter):
    assert counter.owner == owner.key(), "Not your counter!"
    counter.count += 1