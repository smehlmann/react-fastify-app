import got from 'got';
import open from 'open';
import { stringify } from 'csv-stringify/sync';
import { setTimeout } from 'timers/promises'
import * as tokenUtils from './tokenUtils.js';
import * as util from 'util';
import * as xml2js from 'xml2js';

const apiBase = 'https://stigman.nren.navy.mil/np/api';
const oidcBase = 'https://stigman.nren.navy.mil/auth/realms/np-stigman'
const client_id = 'np-stig-manager'

const scope =
  'openid stig-manager:collection stig-manager:user stig-manager:stig stig-manager:op stig-manager:stig:read stig-manager:stig:write'
var deviceCodeResponse;

async function getMetricsData(accessToken, myUrl) {

  //console.log(myUrl);
  try {

    return await got.get(myUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).json();
  }
  catch (e) {
    //console.log('Error in getMetricsData url: ' + myUrl);
    console.log(e.message);
    var msg = e.message.toLowerCase();
    var errMsg = 'response code 401';
    if(!msg.includes(errMsg)){
      return null;
    }
    console.log('Get new token');
    var newToken = await tokenUtils.refreshTokens();
    //var newToken = await tokenUtils.getTokens(oidcBase, client_id, scope);
    return await got.get(myUrl, {
      headers: {
        Authorization: `Bearer ${newToken.access_token}`
      }
    }).json();
  }
}

async function getXMLMetricsData(accessToken, myUrl) {

  //console.log(myUrl);

  const parser = new xml2js.Parser;

  try {

    const response = await got.get(myUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    var jsonResp;
    var xmlResp = response.body;
    //console.log(xmlResp);
    parser.parseString(xmlResp, function (err, result) {
      //console.log(result);
      //console.log('Done');
      jsonResp = result;
    });
    return jsonResp;
  }
  catch (e) {
    console.log('Error in geXMLtMetricsData url: ' + myUrl);
    console.log(e.message);
    console.log('Get new token');
    var newToken = await tokenUtils.refreshTokens();
    //var newToken = await tokenUtils.getTokens(oidcBase, client_id, scope);
    const response = await got.get(myUrl, {
      headers: {
        Authorization: `Bearer ${newToken.access_token}`
      }
    });
    var myResponse = parser.toJson(response.bodys);
    return myResponse;
  }
}

async function getCollections(accessToken) {

  try {
    var myUrl = apiBase + '/collections';
    var collections = getMetricsData(accessToken, myUrl);
    return collections;
  }
  catch (e) {
    console.log('Error in getCollections');
    console.log(e);
  }
}

async function getCollectionByName(accessToken, collectionName) {

  // add escape characters to slashes in the collection name
  var tempName = collectionName.replaceAll("/", "%2F");
  tempName = tempName.replaceAll("&", "%26");
  var myUrl = apiBase + '/collections?name=' + tempName + '&name-match=exact';
  //console.log('url: ' + myUrl);
  var collections = getMetricsData(accessToken, myUrl);
  return collections;
}

async function getStigs(accessToken, collectionId) {
  //console.log('inGetStigs')
  var myUrl = apiBase + '/collections/' + collectionId + '/stigs'
  var stigs = getMetricsData(accessToken, myUrl)
  return stigs
}

async function getStigById(accessToken, benchmarkId) {
  //console.log('inGetStigs')
  var myUrl = apiBase + '/stigs/' + benchmarkId ;
  var stig = getMetricsData(accessToken, myUrl)
  return stig
}

async function getStigsByAsset(accessToken, assetId) {

  try {
    //console.log('inGetStigsByAssets')
    var myUrl = apiBase + '/assets/' + assetId + '/stigs';
    //console.log('myUrl: ' + myUrl);
    var stigs = await getMetricsData(accessToken, myUrl)
    return stigs
  }
  catch (e) {
    console.log('Error in getStigsByAsset');
    console.log(e);
  }
}

async function getAssets(accessToken, collectionId, benchmarkId) {
  //console.log('inGetStigs')
  var myUrl = apiBase + '/collections/' + collectionId + '/stigs/' + benchmarkId + '/assets'
  var assets = getMetricsData(accessToken, myUrl)
  return assets
}

async function getAssetsByCollection(accessToken, collectionId) {

  try {
    //console.log('getAssetsByCollection');
    var myUrl = apiBase + '/assets?collectionId=' + collectionId + '&name-match=exact';
    var assets = getMetricsData(accessToken, myUrl)
    return assets;
  }
  catch (e) {
    console.log('Error in getAssetsByCollection');
    console.log(e);
  }
}

async function getAssetsByLabel(accessToken, collectionId, labelId) {

  //console.log('getAssetsByLabel');
  var myUrl = apiBase + '/collections/' + collectionId + '/labels/' + labelId + '/assets';
  var assets = getMetricsData(accessToken, myUrl)
  return assets;
}

async function getAssetsByName(accessToken, collectionId, assetName) {

  var myUrl = apiBase + '/assets?collectionId=' + collectionId + '&name=' + assetName + '&name-match=exact';
  //console.log('getAssetsByName: ' + myUrl);
  var asset = await getMetricsData(accessToken, myUrl);
  //console.log('getAssetsByName: ' + asset);
  return asset;
}


async function getFindingsByCollectionAndAsset(accessToken, collectionId, assetId) {

  //console.log('getFindingsByCollectionAndAsset assetId: ' + assetId);
  var myUrl = apiBase + '/collections/' + collectionId + '/findings?aggregator=ruleId&acceptedOnly=false&assetId=' + assetId;
  var assets = getMetricsData(accessToken, myUrl)
  return assets;

}

async function getFindingsByCollection(accessToken, collectionId) {

  //console.log('getFindingsByCollectionAndAsset assetId: ' + assetId);
  var myUrl = apiBase + '/collections/' + collectionId + 'findings?aggregator=ruleId&acceptedOnly=false';
  var assets = getMetricsData(accessToken, myUrl)
  return assets;

}

async function getCollectionMertics(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/detail/collection?format=json';
  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

async function getCollectionMerticsAggreatedByLabel(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/summary/label?format=json';
  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

async function getCollectionMerticsAggreatedByAsset(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/summary/asset?format=json';
  //console.log(myUrl);
  try {
    var metrics = getMetricsData(accessToken, myUrl);
    return metrics;
  }
  catch (e) {
    console.log(e);
  }
}

// Return metrics for the specified Collection aggregated by collection ID, stig benchmark, asset ID, label ID
async function getCollectionMerticsByCollectionBenchmarkAsset(accessToken, collectionId,
  benchmark, assetId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/detail/stig?benchmarkId=' +
    benchmark + '&assetId=' + assetId + '&format=json';
  //console.log(myUrl);
  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

// Return metrics for the specified Collection aggregated by collection ID, stig benchmark, asset ID, label ID
async function getCollectionMerticsByCollectionAssetAndLabel(accessToken, collectionId, assetId, labelId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/detail?assetId=' + assetId + '&labelId=' + labelId
    + '&format=json';

  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

// Return metrics for the specified Collection by collection ID, and asset ID
async function getCollectionMerticsByCollectionAndAsset(accessToken, collectionId, assetId) {

  //collections/1/metrics/detail/stig?benchmarkId=Network_WLAN_AP-NIPR_Mgmt_STIG&assetId=1&labelId=1&format=json
  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/detail?assetId=' + assetId + '&format=json';

  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

async function getCollectionMerticsUnaggregated(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/detail?format=json';
  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

async function getCollectionMerticAggregatedByStig(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/summary/stig?format=json';
  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

async function getCollectionMerticsdByStig(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/summary/stig?format=json';
  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;

}

async function getLabelsByCollection(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/labels';
  //console.log(myUrl);
  try {
    var labels = getMetricsData(accessToken, myUrl);
    return labels;
  } catch (e) {
    console.log(e);
  }
}

async function getBenchmarkRevisions(accessToken, benchmarkId) {

  var myUrl = apiBase + '/stigs/' + benchmarkId + '/revisions';
  //console.log(myUrl);
  try {
    var revisions = getMetricsData(accessToken, myUrl);
    return revisions;
  }
  catch (e) {
    console.log('getBenchmarkRevisions error: ' + e);
    console.log(myUrl);
  }
}

async function getCollectionBenchmarkChecklist(
  accessToken, collectionId, benchmarkId, revisionStr) {

  var myUrl = apiBase + '/collections/' + collectionId +
    '/checklists/' + benchmarkId + '/' + revisionStr;
  //console.log(myUrl);
  try {
    var checklists = getMetricsData(accessToken, myUrl);
    return checklists;
  }
  catch (e) {
    console.log('getCollectionBenchmarkChecklist error: ' + e);
    console.log(myUrl);
  }
}

async function getChecklists(
  accessToken, assetId, benchmarkId, revisionStr) {

  var myUrl = apiBase + '/assets/' + assetId +
    '/checklists/' + benchmarkId + '/' + revisionStr;
  //console.log(myUrl);
  try {
    var checklists = await getMetricsData(accessToken, myUrl);
    return checklists;
  }
  catch (e) {
    console.log('getCollectionBenchmarkChecklist error: ' + e);
    console.log(myUrl);
  }
}

async function getAssetChecklists(accessToken, assetId) {

  var myUrl = apiBase + '/assets/' + assetId + '/checklists';
  console.log(myUrl);
  try {
    var checklists = getMetricsData(accessToken, myUrl);
    return checklists;
  }
  catch (e) {
    console.log('getAssetChecklists error: ' + e);
    console.log(e);
  }
}

async function getMultiStigChecklist(accessToken, assetId, benchmarkId) {

  var myUrl = apiBase + '/assets/' + assetId + '/checklists?benchmarkId=' + benchmarkId;
  console.log(myUrl);
  try {
    var checklists = await getXMLMetricsData(accessToken, myUrl);
    return checklists;
  }
  catch (e) {
    console.log('getAssetChecklists error: ' + e);
    console.log(e);
  }
}

async function getReview(
  accessToken, collectionId, assetId, ruleId) {

  var myUrl = apiBase + '/collections/' + collectionId +
    '/reviews/' + assetId + '/' + ruleId;
  //console.log(myUrl);
  try {
    var reviews = getMetricsData(accessToken, myUrl);
    return reviews;
  }
  catch (e) {
    console.log('getReview error: ' + e);
    console.log(myUrl);
  }
}

async function getReviewByGroupId(
  accessToken, collectionId, assetId, benchmarkId, groupId) {

  var myUrl = apiBase + '/collections/' + collectionId +
    '/reviews?rules=all&groupId=' + groupId + '&assetId=' + assetId + '&benchmarkId=' + benchmarkId;
  //console.log(myUrl);
  try {
    var reviews = getMetricsData(accessToken, myUrl);
    return reviews;
  }
  catch (e) {
    console.log('getReview error: ' + e);
    console.log(myUrl);
  }
}


async function getReviews(accessToken, collectionId, benchmarkId, ruleId, groupId) {

  var allReviews = [];
  var myUrl = apiBase + '/collections/' + collectionId +
    '/reviews?status=submitted&ruleId=' + ruleId + '&groupId=' + groupId + '&benchmarkId=' + benchmarkId;
  // '/reviews?result=informational&status=submitted&ruleId=' + ruleId + '&groupId=' + groupId + '&benchmarkId=' + benchmarkId;
  //console.log(myUrl);


  try {
    var reviews = await getMetricsData(tokenUtils.getMyTokens().access_token, myUrl);
    allReviews = reviews;

    /*
    myUrl = apiBase + '/collections/' + collectionId +
    '/reviews?result=fail&status=submitted&ruleId=' + ruleId + '&groupId=' + groupId;
    reviews = await getMetricsData(tokenUtils.getMyTokens().access_token, myUrl);
    allReviews = allReviews.concat(reviews);

    myUrl = apiBase + '/collections/' + collectionId +
      '/reviews?result=notchecked&status=submitted&benchmarkId=' + benchmarkId;
    reviews = await getMetricsData(tokenUtils.getMyTokens().access_token, myUrl);
    allReviews = allReviews.concat(reviews);
    */

    return allReviews;
  }
  catch (e) {
    console.log('getReviews error: ' + e);
    console.log(myUrl);
  }
}

async function getReviewsByCollection(accessToken, collectionId) {

  var myUrl = apiBase + '/collections/' + collectionId +
    '/reviews?status=submitted&projection=stigs';
  //console.log(myUrl);
  try {
    var reviews = await getMetricsData(accessToken, myUrl);
    return reviews;
  }
  catch (e) {
    console.log('getReview error: ' + e);
    console.log(myUrl);
  }
}

async function getReviewsByCollectionAndStig(accessToken, collectionId, benchmarkId) {

  var myUrl = apiBase + '/collections/' + collectionId +
    '/reviews?result=notapplicable&status=submitted&benchmarkId=' + benchmarkId;
  //'/reviews?rules=current&status=submitted&benchmarkId=' + benchmarkId;
  //'/reviews?result=informational&status=submitted&benchmarkId=' + benchmarkId;
  //'/reviews?benchmarkId=' + benchmarkId + '&projection=stigs';
  console.log(myUrl);
  try {
    var allReviews = [];
    var reviews = await getMetricsData(accessToken, myUrl);
    allReviews = reviews;

    myUrl = apiBase + '/collections/' + collectionId +
      '/reviews?result=fail&status=submitted&benchmarkId=' + benchmarkId;
    reviews = await getMetricsData(accessToken, myUrl);
    allReviews = allReviews.concat(reviews);

    myUrl = apiBase + '/collections/' + collectionId +
      '/reviews?result=notchecked&status=submitted&benchmarkId=' + benchmarkId;
    reviews = await getMetricsData(accessToken, myUrl);
    allReviews = allReviews.concat(reviews);

    return allReviews;
  }
  catch (e) {
    console.log('getReview error: ' + e);
    console.log(myUrl);
  }
}

async function getSubmittedReviewsByCollectionAndAsset(accessToken, collectionId, assetId) {

  var myUrl = apiBase + '/collections/' + collectionId +
    '/reviews/' + assetId + '?status=submitted&projection=stigs';

  //console.log(myUrl);F

  try {

    var reviews = await getMetricsData(tokenUtils.getMyTokens().access_token, myUrl);
    return reviews;
  }
  catch (e) {
    console.log('getSubmittedReviewsByCollectionAndAsset error: ' + e.message);
    console.log(myUrl);
  }
}

async function getAllReviewsByCollectionAndAsset(accessToken, collectionId, assetId) {

  var myUrl = apiBase + '/collections/' + collectionId +
    '/reviews/' + assetId + '?projection=stigs';

  //console.log(myUrl);

  try {
    var reviews = await getMetricsData(tokenUtils.getMyTokens().access_token, myUrl);
    return reviews;
  }
  catch (e) {
    console.log('getReviewByCollectionAndAsset error: ' + e.message);
    console.log(myUrl);
  }
}

async function getReviewByCollectionAndAsset(accessToken, collectionId, assetId) {

  var myUrl = apiBase + '/collections/' + collectionId +
    '/reviews/' + assetId + '?result=informational&projection=stigs';

  //console.log(myUrl);

  try {

    var allReviews = [];
    var reviews = await getMetricsData(tokenUtils.getMyTokens().access_token, myUrl);
    allReviews = reviews;

    myUrl = apiBase + '/collections/' + collectionId +
      '/reviews/' + assetId + '?result=fail&projection=stigs';
    var reviews = await getMetricsData(tokenUtils.getMyTokens().access_token, myUrl);
    allReviews = allReviews.concat(reviews);

    myUrl = apiBase + '/collections/' + collectionId +
      '/reviews/' + assetId + '?result=notchecked&projection=stigs';
    var reviews = await getMetricsData(tokenUtils.getMyTokens().access_token, myUrl);
    allReviews = allReviews.concat(reviews);

    return allReviews;
  }
  catch (e) {
    console.log('getReviewByCollectionAndAsset error: ' + e.message);
    console.log(myUrl);
  }
}

async function createLabel(accessToken, collectionId, labelDetails, labelAssetMap) {

  //var myUrl = apiBase + '/collections/' + collectionId + '/labels';
  //console.log(labelDetails);
  var mappedAssets;

  const primOwner = labelDetails.primOwner;
  const sysAdmin = labelDetails.sysAdmin;
  const assetType = labelDetails.assetType;
  var label;
  var labelName = '';
  var labelId = '';
  var description = '';
  var color = '';

  if (primOwner && !primOwner == '') {
    labelName = labelDetails.primOwner;
    description = 'Primary Owner';
    color = '0000ff';
    await mapLabelsAndAssets(labelName, description, color, labelAssetMap, collectionId, accessToken, labelDetails.asset);
    //console.log(labelAssetMap);
  }
  if (sysAdmin && !sysAdmin == '') {
    labelName = labelDetails.sysAdmin;
    description = 'Sys Admin';
    color = 'ffff00';
    await mapLabelsAndAssets(labelName, description, color, labelAssetMap, collectionId, accessToken, labelDetails.asset);
  }
  if (assetType && !assetType == '') {
    labelName = labelDetails.assetType;
    description = 'Asset Type';
    color = '90EE90';
    await mapLabelsAndAssets(labelName, description, color, labelAssetMap, collectionId, accessToken, labelDetails.asset);
    //console.log(labelAssetMap);
  }

  return;
}

async function
  mapLabelsAndAssets(labelName, description, color, labelAssetMap, collectionId, accessToken, asset) {
  const mappedAssets = labelAssetMap.get(labelName);
  var labelId = '';
  if (!mappedAssets) {
    var label = await saveLabel(accessToken, collectionId, description, labelName, color);
    //console.log(label);
    labelId = label.labelId;
  }
  else {
    labelId = mappedAssets[0].labelId;
  }

  var assetToMap;
  if (labelId !== '') {
    assetToMap = await getAssetsByName(accessToken, collectionId, asset);
    //console.log('back from getAssetsByName');
    // wait a second to give server time to process the request
    await setTimeout(1000);

    //console.log(assetToMap);
    if (assetToMap) {
      //console.log(assetToMap);
      //console.log('assetId: ' + assetToMap[0].assetId);
      //console.log('assetName: ' + assetToMap[0].name);
      await mapAssetToLabel(labelName, labelId, assetToMap[0].assetId, labelAssetMap, collectionId, asset);
      //console.log(labelAssetMap);
    }
  }
}

async function saveLabel(accessToken, collectionId, description, name, color, labelAssetMap) {

  var myUrl = apiBase + '/collections/' + collectionId + '/labels';

  var myLabel = {
    name: name,
    description: description,
    color: color
  }

  var labelData = JSON.stringify(myLabel);
  //console.log(labelData);
  const label = await got
    .post(myUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: labelData
    })
    .json()

  return label;
}

async function saveLabelAssetMapping(accessToken, collectionId, labelId, assetIds) {

  var myUrl = apiBase + '/collections/' + collectionId + "/labels/" + labelId + '/assets';
  //console.log('saveLabelAssetMapping: ' + myUrl);
  const content = JSON.stringify(assetIds);
  //console.log(assetIds);

  try {
    const results = await got
      .put(myUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: content
      })
      .json()

    return results;
  }
  catch (e) {
    console.log(e);
  }
}

async function deleteLabel(accessToken, collectionId, labelId) {

  //console.log('getAssetsByLabel');
  var myUrl = apiBase + '/collections/' + collectionId + '/labels/' + labelId;
  var results = getMetricsData(accessToken, myUrl);
  //console.log('delete results: ' + results);
  return results;
}

async function mapAssetToLabel(labelName, labelId, assetId, labelAssetMap, collectionId, assetName) {

  // Does the labelId already exist in the map
  var assetInfo = {
    labelId: labelId,
    assetId: assetId,
    assetName: assetName
  };

  var assets = labelAssetMap.get(labelName);
  if (assets) {
    assets.push(assetInfo);
    labelAssetMap.set(labelName, assets);
  }
  else {
    var tmpAssets = [];
    tmpAssets.push(assetInfo);
    labelAssetMap.set(labelName, tmpAssets);
  }

}

function setDeviceCode(myDeviceCodeResponse) {
  deviceCodeResponse = myDeviceCodeResponse;
}

async function getResponseForDeviceCode(oidcBase, client_id, scope) {

  try {
    const oidcMeta = await getOidcMetadata(oidcBase)
    if (!oidcMeta.device_authorization_endpoint) {
      console.log(`Device Authorization grant is not supported by the OIDC Provider`)
      process.exit(1);
    }
    const response = await getDeviceCode(oidcMeta.device_authorization_endpoint,
      client_id, scope)

    return response;
  }
  catch (e) {
    console.log(e);
  }
}

function wait(ms = 1000) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function poll(fn, fnCondition, ms) {
  /*let myResult = await fn()
  while (!fnCondition(myResult)) {
    await wait(ms)
    myResult = await fn()
  }
  return myResult*/
  var response = await fn();
  return response;
}

async function getToken(device_code) {
  try {
    console.log('Requesting token')
    const response = await got.post('https://stigman.nren.navy.mil/auth/realms/np-stigman/protocol/openid-connect/token', {
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

async function getTokens(response) {

  try {

    open(response.verification_uri_complete);
    let fetchToken = () => getToken(response.device_code);
    let validate = result => !!result.access_token
    let tokens = await poll(fetchToken, validate, response.interval * 1000)
    console.log(`Got access token from Keycloak`);

    return tokens;
  }
  catch (e) {
    console.log(e);
  }
}

export {
  getCollections,
  getCollectionByName,
  getStigs,
  getStigById,
  getStigsByAsset,
  getAssets,
  getAssetsByLabel,
  getAssetsByCollection,
  getAssetsByName,
  getCollectionMerticsAggreatedByLabel,
  getCollectionMerticsAggreatedByAsset,
  getFindingsByCollectionAndAsset,
  getFindingsByCollection,
  getCollectionMertics,
  getCollectionMerticsByCollectionBenchmarkAsset,
  getCollectionMerticsByCollectionAndAsset,
  getCollectionMerticsByCollectionAssetAndLabel,
  getCollectionMerticsUnaggregated,
  getCollectionMerticsdByStig,
  getLabelsByCollection,
  getBenchmarkRevisions,
  createLabel,
  deleteLabel,
  saveLabelAssetMapping,
  getChecklists,
  getCollectionBenchmarkChecklist,
  getAssetChecklists,
  getMultiStigChecklist,
  getReview,
  getReviews,
  getReviewsByCollection,
  getReviewsByCollectionAndStig,
  getReviewByCollectionAndAsset,
  getAllReviewsByCollectionAndAsset,
  getReviewByGroupId,
  getSubmittedReviewsByCollectionAndAsset,
  setDeviceCode
};