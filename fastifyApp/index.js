import Fastify from 'fastify';
import cors from '@fastify/cors';
import got from 'got'
import open from 'open'
import promptSync from 'prompt-sync'
import { stringify } from 'csv-stringify/sync'
import * as reportGetters from './reports/reportGetters.js';
import * as statusReport from './reports/statusReport.js';
import * as assetCountReport from './reports/assetCountReport.js';
import * as saReport from './reports/saReport.js';
import * as saReportByAsset from './reports/saReportByAsset.js';
import * as assetCountReportByEmass from './reports/assetCountReportByEmass.js';
import * as saReportByLabelAndEmass from './reports/saReportByLabelAndEmass.js';
import * as assetsByCollectionsReport from './reports/assetsByCollectionsReport.js';
import * as saReportWithMetricsAndVersions from './reports/saReportWithMetricsAndVersions.js';
import * as stigBenchmarkByResults from './reports/stigBenchmarkByResults.js';
import * as manageLabels from './labelOps/manageLabels.js';
import * as tokenUtils from './reports/tokenUtils.js';

const oidcBase = 'https://stigman.nren.navy.mil/auth/realms/np-stigman'
const apiBase = 'https://stigman.nren.navy.mil/np/api'
const client_id = 'np-stig-manager'
const scope =
  'openid stig-manager:collection stig-manager:user stig-manager:stig stig-manager:op stig-manager:stig:read stig-manager:stig:write'

const myTokenUtils = tokenUtils;

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  // put your options here
})

const prompt = promptSync();
var rows = [];

fastify.post('/labels', (req, reply) => {
  var labelInfo = req.body;
  console.log('labelInfo: ' + labelInfo);
  labelInfo.forEach((labelDetail) => {
    console.log(labelDetail);
  });

  /* create the labels */
  retData = addLabels(labelInfo, reply);
})

fastify.get('/', (req, reply) => {
  console.log('req: ' + req.url);
  var url = req.url;
  var paramList = url.split('&');
  paramList[0] = paramList[0].substring(2);
  var reportNum;
  var emassNums;
  var parsedLabelData;

  for (var i = 0; i < paramList.length; i++) {
    var param = paramList[i].split('=');
    if (param[0] === 'reportNum') {
      reportNum = param[1];
    }
    else if (param[0] === 'emassNum') {
      emassNums = param[1];
    }
    else if (param[0] === 'parsedData') {
      parsedData = param[1];
    }
  }

  console.log('calling Run(' + reportNum + ')');
  rows = runReports(reportNum, emassNums, reply);
})


/* wait for events on port 5000 */
await fastify.listen({ port: 5000 });

async function addLabels(labelInfo, reply) {
  const myReply = await createLabels(labelInfo);
  var msg = 'Label creation done!';
  //msg = stringify(msg);
  console.log(msg);
  //reply.send(msg);
}

async function createLabels(labelInfo) {
  rows = [];
  try {
    console.log('Create labels.');
    let tokens = await myTokenUtils.getTokens(oidcBase, client_id, scope);
    rows = await manageLabels.addNewLabel(tokens, labelInfo);
    //rows = await manageLabels.addNewLabel(oidcBase, client_id, scope, labelInfo);
    return rows;
  }
  catch (e) {
    console.log(e.message);
  }
}

async function runReports(reportNum, emassNums, reply) {
  const rows = await run(reportNum, emassNums);
  //console.log('calling stringify');
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
      let tokens = await myTokenUtils.getTokens(oidcBase, client_id, scope);
      rows = await assetsByCollectionsReport.runAssetByCollectionReport(myTokenUtils, emassNums);
      return rows;
    }
    else if (selection == 2) {
      console.log('Run Status Report');
      let tokens = await myTokenUtils.getTokens(oidcBase, client_id, scope);
      rows = await statusReport.runStatusReport(myTokenUtils, emassNums);
      return rows;
    }
    else if (selection == 3) {
      console.log('Run Asset Count Report');
      let tokens = await myTokenUtils.getTokens(oidcBase, client_id, scope);
      rows = await assetCountReport.runAssetCountReport(myTokenUtils, emassNums);
      return rows;
    }
    else if (selection == 4) {
      console.log('Run SA Report');
      let tokens = await myTokenUtils.getTokens(oidcBase, client_id, scope);
      rows = await saReport.runSAReport(myTokenUtils, emassNums);
      return rows;
    }
    else if (selection == 5) {
      console.log('Run SA Report by Asset')
      let tokens = await myTokenUtils.getTokens(oidcBase, client_id, scope);
      rows = await saReportByAsset.runSAReportByAsset(myTokenUtils, emassNums);
      return rows;
    }
    else if (selection == 6) {
      console.log('Run Asset Count Report by EMASS Number')
      let tokens = await myTokenUtils.getTokens(oidcBase, client_id, scope);
      rows = await assetCountReportByEmass.runAssetCountReportByEmass(myTokenUtils, emassNums);
      return rows;
    }
    else if (selection == 7) {
      console.log('Run SAReport by Label and EMASS');
      let tokens = await myTokenUtils.getTokens(oidcBase, client_id, scope);
      rows = await saReportByLabelAndEmass.runSAReportByLabelAndEmass(myTokenUtils, emassNums);
      return rows;
    }
    else if (selection == 8) {
      console.log('Run SAReport with Metrics and STIG Benchmark Revisions');
      let tokens = await myTokenUtils.getTokens(oidcBase, client_id, scope);
      rows = await saReportWithMetricsAndVersions.runSAReportWithMetricsAndVersions(myTokenUtils, emassNums);
      return rows;
    }
    else if (selection == 9) {
      // run STIG Benchmark by Results
      console.log('Run STIG Benchmark by Results');
      let tokens = await myTokenUtils.getTokens(oidcBase, client_id, scope);
      rows = await stigBenchmarkByResults.runStigBenchmarkByResults(myTokenUtils, emassNums,);
      return rows;
    }
    else if (selection == 102) {
      console.log('Run Delete All Labels');
      let tokens = await myTokenUtils.getTokens(oidcBase, client_id, scope);
      rows = await manageLabels.deleteAllLabels(tokens);
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

