import got from 'got';
import open from 'open';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path';
import { setTimeout } from 'timers/promises'

const apiBase = 'https://stigman.nren.navy.mil/np/api';

async function getMetricsData(accessToken, myUrl) {

  //console.log("getMetricsData: Requesting data.")
  return await got.get(myUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }).json()
}

async function getCollections(accessToken) {

  var myUrl = apiBase + '/collections';
  var collections = getMetricsData(accessToken, myUrl);
  return collections;
}

async function getCollectionByName(accessToken, collectionName) {

  // add escape characters to slashes in the collection name
  var tempName = collectionName.replaceAll("/", "%2F");
  tempName = tempName.replaceAll("&", "%26");
  var myUrl = apiBase + '/collections?name=' + tempName + '&name-match=exact';
  console.log('url: ' + myUrl);
  var collections = getMetricsData(accessToken, myUrl);
  return collections;
}

async function getStigs(accessToken, collectionId) {
  //console.log('inGetStigs')
  var myUrl = apiBase + '/collections/' + collectionId + '/stigs'
  var stigs = getMetricsData(accessToken, myUrl)
  return stigs
}

async function getStigsByAsset(accessToken, assetId) {
  //console.log('inGetStigsByAssets')
  var myUrl = apiBase + '/assets/' + assetId + '/stigs';
  //console.log('myUrl: ' + myUrl);
  var stigs = getMetricsData(accessToken, myUrl)
  return stigs
}

async function getAssets(accessToken, collectionId, benchmarkId) {
  //console.log('inGetStigs')
  var myUrl = apiBase + '/collections/' + collectionId + '/stigs/' + benchmarkId + '/assets'
  var assets = getMetricsData(accessToken, myUrl)
  return assets
}

async function getAssetsByCollection(accessToken, collectionId) {

  //console.log('getAssetsByCollection');
  var myUrl = apiBase + '/assets?collectionId=' + collectionId + '&name-match=exact';
  var assets = getMetricsData(accessToken, myUrl)
  return assets;
}

async function getAssetsByLabel(accessToken, collectionId, labelId) {

  //console.log('getAssetsByLabel');
  var myUrl = apiBase + '/collections/' + collectionId + '/labels/' + labelId + '/assets';
  var assets = getMetricsData(accessToken, myUrl)
  return assets;
}

async function getAssetsByName(accessToken, collectionId, assetName) {

  var myUrl = apiBase + '/assets?collectionId=' + collectionId + '&name=' + assetName + '&name-match=exact';
  console.log('getAssetsByName: ' + myUrl);
  var asset = await getMetricsData(accessToken, myUrl);
  console.log('getAssetsByName: ' + asset);
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
  console.log(myUrl);
  try{
  var metrics = getMetricsData(accessToken, myUrl);
  return metrics;
  }
  catch(e){
    console.log(e);
  }
}

// Return metrics for the specified Collection aggregated by collection ID, stig benchmark, asset ID, label ID
async function getCollectionMerticsByCollectionBenchmarkAsset(accessToken, collectionId,
  benchmark, assetId) {

  var myUrl = apiBase + '/collections/' + collectionId + '/metrics/detail/stig?benchmarkId=' +
    benchmark + '&assetId=' + assetId + '&format=json';
  console.log(myUrl);
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
  console.log(myUrl);
  try {
    var labels = getMetricsData(accessToken, myUrl);
    return labels;
  } catch (e) {
    console.log(e);
  }
}

async function getBenchmarkRevisions(accessToken, benchmarkId) {
  var myUrl = apiBase + '/stigs/' + benchmarkId + '/revisions';
  console.log(myUrl);
  try {
    var revisions = getMetricsData(accessToken, myUrl);
    return revisions;
  }
  catch (e) {
    console.log('getBenchmarkRevisions error: ' + e);
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

  //if (primOwner == '' && sysAdmin == '') {
  //labelName = 'CSS';
  //description = 'CSS';
  //color = '99CCFF';
  //await mapLabelsAndAssets(labelName,
  //labelId, description, color, labelAssetMap, collectionId, accessToken, labelDetails.asset);
  /*label = await saveLabel(accessToken, collectionId, 'CSS', 'CSS', '99CCFF');*/

  //}  
  //const mappedAssets = labelAssetMap.get(labelName);
  //const mappedAssets = mapLabelsAndAssets(labelName, labelAssetMap);
  /*if (!mappedAssets) {
    label = await saveLabel(accessToken, collectionId, description, labelName, color);
    if (label) {
      var asset = await getAssetsByName(accessToken, collectionId, labelDetails.asset);
      if (asset) {
        await mapAssetToLabel(label.labelId, asset.assetId, labelAssetMap, asset.name);
      }
    }
  }*/

  return;
}

async function
  mapLabelsAndAssets(labelName, description, color, labelAssetMap, collectionId, accessToken, asset) {
  const mappedAssets = labelAssetMap.get(labelName);
  var labelId = '';
  if (!mappedAssets) {
    var label = await saveLabel(accessToken, collectionId, description, labelName, color);
    console.log(label);
    labelId = label.labelId;
  }
  else {
    labelId = mappedAssets[0].labelId;
  }

  var assetToMap;
  if (labelId !== '') {
    assetToMap = await getAssetsByName(accessToken, collectionId, asset);
    console.log('back from getAssetsByName');
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
  console.log('saveLabelAssetMapping: ' + myUrl);
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
  console.log('delete results: ' + results);
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

export {
  getCollections,
  getCollectionByName,
  getStigs,
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
  saveLabelAssetMapping
};