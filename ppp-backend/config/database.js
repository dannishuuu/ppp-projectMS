const SequelizeLib = require('sequelize');
require('dotenv').config();

const Sequelize = SequelizeLib.Sequelize || SequelizeLib;
const sequelizeVersion = require('sequelize/package.json').version;
const pgVersion = require('pg/package.json').version;
const sequelizeMajor = Number(sequelizeVersion.split('.')[0]);
const pgMajor = Number(pgVersion.split('.')[0]);

if (sequelizeMajor < 4 && pgMajor >= 7) {
  throw new Error(
    `Incompatible database driver versions: sequelize@${sequelizeVersion} cannot use pg@${pgVersion}. ` +
    'Use pg 6.x with Sequelize 3, or upgrade Sequelize before using pg 7+.'
  );
}

// ---------------------------------------------------------------------------
// pg@6 compatibility shim for modern Node.js (v12+)
//
// In modern Node a fresh net.Socket reports readyState === 'open', so pg 6's
// original Connection.connect() takes its "already open" branch: it never
// calls stream.connect() and emits 'connect' synchronously — before the
// Client has attached its startup listener. Result: no TCP connection is ever
// made and every db.query() hangs forever (this is what stalled
// POST /api/v1/login). This override forces a real socket connection for
// fresh sockets and always emits 'connect' asynchronously.
// ---------------------------------------------------------------------------
const PgConnection = require('pg/lib/connection');

PgConnection.prototype.connect = function (port, host) {
  var self = this;
  var alreadyOpen =
    this.stream.readyState !== 'closed' &&
    !this.stream.connecting &&
    this.stream.remoteAddress !== undefined;

  if (alreadyOpen) {
    // Pre-connected custom stream — emit asynchronously so listeners that are
    // attached right after this call are registered in time.
    process.nextTick(function () {
      self.emit('connect');
    });
  } else {
    // Fresh (or closed) socket — really open the TCP/unix connection.
    this.stream.connect(port, host);
  }

  this.stream.on('connect', function () {
    if (self._keepAlive) {
      self.stream.setKeepAlive(true);
    }
    self.emit('connect');
  });

  this.stream.on('error', function (error) {
    // don't raise ECONNRESET errors - they can & should be ignored during disconnect
    if (self._ending && error.code == 'ECONNRESET') {
      return;
    }
    self.emit('error', error);
  });

  this.stream.on('close', function () {
    self.emit('end');
  });

  if (!this.ssl) {
    return this.attachListeners(this.stream);
  }

  this.stream.once('data', function (buffer) {
    var responseCode = buffer.toString('utf8');
    if (responseCode != 'S') {
      return self.emit('error', new Error('The server does not support SSL connections'));
    }
    var tls = require('tls');
    self.stream = tls.connect({
      socket: self.stream,
      servername: host,
      rejectUnauthorized: self.ssl.rejectUnauthorized,
      ca: self.ssl.ca,
      pfx: self.ssl.pfx,
      key: self.ssl.key,
      passphrase: self.ssl.passphrase,
      cert: self.ssl.cert,
      NPNProtocols: self.ssl.NPNProtocols,
    });
    self.attachListeners(self.stream);
    self.emit('sslconnect');

    self.stream.on('error', function (error) {
      self.emit('error', error);
    });
  });
};

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    native: false,
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
