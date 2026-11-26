// MacBook database-free fault checks: harmless subprocesses and ephemeral loopback.
import assert from 'node:assert/strict';
import test from 'node:test';
import net from 'node:net';
import {createOwnedGroups,waitBounded} from './r5a-owned-process-groups.mjs';

const listenerSource = `
  const net=require('node:net');
  const server=net.createServer(socket=>socket.destroy());
  server.on('error',()=>process.exit(1));
  server.listen(0,'127.0.0.1',()=>process.send({port:server.address().port}));
`;
const leaderSource = `
  const {spawn}=require('node:child_process');
  const child=spawn(process.execPath,['-e',process.argv[1]],{stdio:['ignore','ignore','ignore','ipc']});
  child.once('error',()=>process.exit(1));
  child.once('exit',()=>process.exit(1));
  child.once('message',msg=>{
    process.send(msg,err=>{
      if(err)process.exit(1);
      child.disconnect();child.unref();process.exit(0);
    });
  });
`;
function ready(item){
  return new Promise((resolve,reject)=>{
    item.child.once('message',msg=>resolve(msg));
    item.child.once('error',reject);
    // A leader can exit normally just after publishing readiness.
    item.child.once('exit',code=>{if(code!==0)reject(Error('FIXTURE_EXITED'));});
  });
}
function bind(port){
  return new Promise((resolve,reject)=>{
    const server=net.createServer(socket=>socket.destroy());
    server.once('error',reject);
    server.listen(port,'127.0.0.1',()=>server.close(err=>err?reject(err):resolve()));
  });
}
function validate(msg){
  assert.ok(msg&&Number.isInteger(msg.port)&&msg.port>0&&msg.port<=65535&&msg.port!==8789,'EPHEMERAL_PORT_REQUIRED');
  return msg.port;
}
const env={PATH:'/usr/bin:/bin',HOME:process.env.HOME,TMPDIR:process.env.TMPDIR,TZ:'UTC'};
test('real descendant survives leader exit, cleanup releases its loopback port',{timeout:20000},async()=>{
  const groups=createOwnedGroups();
  try{
    const item=groups.start(process.execPath,['-e',leaderSource,listenerSource],{env,stdio:['ignore','ignore','ignore','ipc']});
    const port=validate(await waitBounded(ready(item),5000));
    assert.deepEqual(await waitBounded(item.completion,5000),{code:0,signal:null});
    await assert.rejects(bind(port),err=>err.code==='EADDRINUSE');
    await groups.cleanupAll();
    assert.equal(item.gone,true);
    await bind(port);
  }finally{await groups.cleanupAll();}
});
test('deadline expiry is not success and cleanup releases occupied fixture port',{timeout:20000},async()=>{
  const groups=createOwnedGroups();
  try{
    const item=groups.start(process.execPath,['-e',listenerSource],{env,stdio:['ignore','ignore','ignore','ipc']});
    const port=validate(await waitBounded(ready(item),5000));
    assert.equal(await waitBounded(item.completion,100),null);
    await assert.rejects(bind(port),err=>err.code==='EADDRINUSE');
    await groups.cleanupAll();
    assert.equal(item.done,true);
    assert.equal(item.gone,true);
    await bind(port);
  }finally{await groups.cleanupAll();}
});
