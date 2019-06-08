const createForwarder = require('../helpers/forwarder');
const { getEncodedCall, checkErrorRevert } = require('../helpers/utils');
const { keccak256 } = web3.utils;

const Identity = artifacts.require('Identity');
const KeyManager = artifacts.require('KeyManager');

contract('Forwarder', async (accounts) => {
  it('should be able to use Identity contract with forwarder', async () => {
    console.log("111111111");
    const identity = await Identity.new(accounts[0]);
    console.log("222222222");
    const encodedData = getEncodedCall(identity, 'initialize', [keccak256(accounts[0])]);
    console.log("333333333");
    const forwarder = await createForwarder(identity.address, encodedData);
    console.log("411111111");

    const identityForwarder = await Identity.at(forwarder.options.address);
    console.log("511111111");
    await checkErrorRevert(identityForwarder.initialize(accounts[0]), 'contract-already-initialized');
    console.log("611111111");

    // this call fails with "only-owner-allowed"
    await identityForwarder.setData('0x0a', keccak256(accounts[1]));
    console.log("711111111");

    const owner = await identityForwarder.getData('0x00');
    console.log("811111111");
    const data = await identityForwarder.getData('0x0a');
    console.log("911111111");

    assert.equal(owner, keccak256(accounts[0]));
    assert.equal(data, keccak256(accounts[1]));
  });

  it('should be able to use KeyManager contract with forwarder', async () => {
    const keyManager = await KeyManager.new(accounts[0]);
    const encodedData = getEncodedCall(keyManager, 'initialize');
    const forwarder = await createForwarder(keyManager.address, encodedData);

    const keyManagerForwarder = await KeyManager.at(forwarder.options.address);
    await checkErrorRevert(keyManagerForwarder.initialize(), 'contract-already-initialized');

    await keyManagerForwarder.setKey('0x0a', 2, 2);

    let keyData = await keyManagerForwarder.getKey(keccak256(accounts[0]));
    assert.equal(keyData[0].toNumber(), 1);
    assert.equal(keyData[1].toNumber(), 1);

    keyData = await keyManagerForwarder.getKey('0x0a');
    assert.equal(keyData[0].toNumber(), 2);
    assert.equal(keyData[1].toNumber(), 2);
  });

  it('should not be able to create forwarder if initialization transaction data is not passed', async () => {
    const keyManager = await KeyManager.new();
    await checkErrorRevert(createForwarder(keyManager.address, '0x00'), 'initialization-failed');
  });

  it('should not be able to send transaction without function signature', async () => {
    const keyManager = await KeyManager.new();
    const encodedData = getEncodedCall(keyManager, 'initialize');
    const forwarder = await createForwarder(keyManager.address, encodedData);

    await checkErrorRevert(web3.eth.sendTransaction({
      from: accounts[0],
      to: forwarder.options.address,
      value: 1
    }), 'function-signature-not-specified');
  });
});
