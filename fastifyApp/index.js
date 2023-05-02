import Fastify from 'fastify';
import cors from '@fastify/cors';

import got from 'got'
import open from 'open'
import promptSync from 'prompt-sync'
import { stringify } from 'csv-stringify/sync'
import fs from 'fs'
import path from 'path';
import * as reportGetters from './reports/reportGetters.js';
import * as statusReport from './reports/statusReport.js';
import * as assetCountReport from './reports/assetCountReport.js';
import * as saReport from './reports/saReport.js';
import * as saReportByAsset from './reports/saReportByAsset.js';
import * as assetCountReportByEmass from './reports/assetCountReportByEmass.js';
import * as saReportByLabelAndEmass from './reports/saReportByLabelAndEmass.js';
import * as assetsByCollectionsReport from './reports/assetsByCollectionsReport.js';

const oidcBase = 'https://stigman.nren.navy.mil/auth/realms/np-stigman'
const apiBase = 'https://stigman.nren.navy.mil/np/api'
const client_id = 'np-stig-manager'
const scope = 'openid stig-manager:collection stig-manager:user stig-manager:stig stig-manager:op'


const fastify = Fastify({
  logger: true
})

await fastify.register(cors, {
  // put your options here
})

const prompt = promptSync();
var rows = [];

fastify.get('/', (req, reply) => {
  console.log('req: ' + req.url);
  var url = req.url;
  var paramList = url.split('&');
  paramList[0] = paramList[0].substring(2);
  var reportNum;
  var emassNums;
  for(var i = 0; i < paramList.length; i++){
    var param = paramList[i].split('=');
    if(param[0] === 'reportNum'){
      reportNum = param[1];
    }
    else if(param[0] === 'emassNum'){
      emassNums = param[1];
    }
  }
  
  console.log('calling Run(' + reportNum + ')');
  rows = runReports(reportNum, emassNums, reply);
  //rows = run(reportNum);
  //reply.send({ hello: 'world' })
})

await fastify.listen({ port: 5000 });

async function runReports(reportNum, emassNums, reply) {
  const rows = await run(reportNum, emassNums);
  console.log('calling stringify');
  const output = stringify(rows, function (err, output) {
    header: true
    //console.log(output)

  });
  //console.log(output);
  reply.send(output);
}

async function run(selection, emassNums) {

  var rows = [];
  try {
    if (selection == 1) {
      console.log('Run Assets by Collection');
      let tokens = await getTokens(oidcBase, client_id, scope);
      rows = await assetsByCollectionsReport.runAssetByCollectionReport(tokens);
      return rows;
    }
    else if (selection == 2) {
      console.log('Run Status Report');
      let tokens = await getTokens(oidcBase, client_id, scope);
      rows = await statusReport.runStatusReport(tokens);
      return rows;
    }
    else if (selection == 3) {
      console.log('Run Asset Count Report');
      let tokens = await getTokens(oidcBase, client_id, scope);
      rows = await assetCountReport.runAssetCountReport(tokens);
      return rows;
    }
    else if (selection == 4) {
      console.log('Run SA Report');
      let tokens = await getTokens(oidcBase, client_id, scope);
      rows = saReport.runSAReport(tokens);
      return rows;
    }
    else if (selection == 5) {
      console.log('Run SA Report by Asset')
      let tokens = await getTokens(oidcBase, client_id, scope);
      rows = await saReportByAsset.runSAReportByAsset(tokens, emassNums);
      return rows;
    }
    else if (selection == 6) {
      console.log('Run Asset Count Report by EMASS Number')
      let tokens = await getTokens(oidcBase, client_id, scope);
      rows = await assetCountReportByEmass.runAssetCountReportByEmass(tokens);
      return rows;
    }
    else if (selection == 7) {
      console.log('Run SAReport by Label and EMASS');
      let tokens = await getTokens(oidcBase, client_id, scope);
      rows = await saReportByLabelAndEmass.runSAReportByLabelAndEmass(tokens);
      return rows;
    }
    else {
      console.log('You must provide a valid report option.');
    }
  }
  catch (e) {
    console.log(e.message);
  }
}

function wait(ms = 1000) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function poll(fn, fnCondition, ms) {
  let result = await fn()
  while (!fnCondition(result)) {
    await wait(ms)
    result = await fn()
  }
  return result
}

async function getToken(device_code) {
  try {
    console.log('Requesting token')
    const response = await got.post('https://stigman.nren.navy.mil/auth/realms/np-stigman/protocol/openid-connect/token', {
      //const response = await got.post('https://stigman.nren.navy.mil/auth/realms/np-stigman/protocol/openid-connect/token',{
      //const response = await got.post('http://localhost:8080/realms/stigman/protocol/openid-connect/token', {
      //const response = await got.post('https://login.microsoftonline.com/863af28d-88be-4b4d-a58a-d5c40ee1fa22/oauth2/v2.0/token', {
      form: {
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: 'np-stig-manager',
        device_code
      }
    }).json()
    return response
  }
  catch (e) {
    console.log(e)
    return {}
  }
}

async function getDeviceCode(url, client_id, scope) {
  return await got.post(url, {
    form: {
      client_id,
      scope
    }
  }).json()
}

async function getOidcMetadata(url) {
  return await got.get(`${url}/.well-known/openid-configuration`).json()
}

async function getMetricsData(accessToken, myUrl) {
  //console.log("getMetricsData: Requesting data.")
  return await got.get(myUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }).json()
}

async function getTokens(oidcBase, client_id, scope) {

  try {

    const oidcMeta = await getOidcMetadata(oidcBase)
    if (!oidcMeta.device_authorization_endpoint) {
      console.log(`Device Authorization grant is not supported by the OIDC Provider`)
      process.exit(1);
    }
    const response = await getDeviceCode(oidcMeta.device_authorization_endpoint, client_id, scope)

    //console.log(response)

    //await new Promise(resolve => setTimeout(resolve, 5000));
    //console.log(process.argv)

    //open(process.argv[2] === 'complete' ? response.verification_uri_complete : response.verification_uri)
    open(response.verification_uri_complete)


    let fetchToken = () => getToken(response.device_code)

    let validate = result => !!result.access_token
    let tokens = await poll(fetchToken, validate, response.interval * 1000)
    console.log(`Got access token from Keycloak`);

    return tokens;
  }
  catch (e) {
    console.log(e);
  }
}