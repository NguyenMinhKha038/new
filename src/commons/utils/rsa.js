import NodeRSA from 'node-rsa';

export class RSA {
  /**
   *Creates an instance of RSA.
   *
   * @param {string} encryptedKey
   * @memberof RSA
   */
  constructor(encryptedKey) {
    this._encryptedKey = encryptedKey;
    this._key = new NodeRSA();
    this.loadKey();
  }

  loadKey() {
    this._key.importKey(this._encryptedKey);
    this._key.setOptions({
      environment: 'node',
      encryptionScheme: 'pkcs1',
      signingScheme: 'pkcs1'
    });
  }
  /**
   *
   *
   * @param {string} message
   * @returns {string}
   * @memberof RSA
   */
  encrypt(message) {
    return this._key.encrypt(message, 'base64');
  }
  /**
   *
   *
   * @param {string} encryptedData
   * @returns {string}
   * @memberof RSA
   */
  decrypt(encryptedData) {
    return this._key.decryptPublic(Buffer.from(encryptedData, 'base64'), 'utf-8');
  }
}

export default RSA;
