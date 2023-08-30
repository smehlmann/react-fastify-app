import got from 'got';
import open from 'open';

var myTokens;

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
            form: {
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                client_id: 'np-stig-manager',
                device_code
            }
        }).json()
        return response
    }
    catch (e) {
        console.log(e.message)
        return {}
    }
}


async function getTokens(oidcBase, client_id, scope) {

    try {
        const oidcMeta = await getOidcMetadata(oidcBase)
        if (!oidcMeta.device_authorization_endpoint) {
            console.log(`Device Authorization grant is not supported by the OIDC Provider`)
            process.exit(1);
        }
        const response = await getDeviceCode(oidcMeta.device_authorization_endpoint,
            client_id, scope)

        open(response.verification_uri_complete)

        let fetchToken = () => getToken(response.device_code);
        let validate = result => !!result.access_token
        let tokens = await poll(fetchToken, validate, response.interval * 1000)
        console.log(`Got access token from Keycloak`);
        myTokens = tokens;
        return tokens;
    }
    catch (e) {
        console.log(e.message);
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

function getMyTokens(){
    return myTokens;
}

function setMyTokens(tokens){
    myTokens = tokens;
}

async function refreshTokens(){
    try {
        console.log('Requesting token');
        var tokens = getMyTokens();
        const response = await got.post('https://stigman.nren.navy.mil/auth/realms/np-stigman/protocol/openid-connect/token', {
            form: {
                grant_type: 'refresh_token',
                refresh_token: tokens.refresh_token,
                client_id: 'np-stig-manager'
            }
        }).json();

        setMyTokens(response);
        return response
    }
    catch (e) {
        console.log(e.message)
        return {}
    }
}
export { getTokens, getMyTokens, refreshTokens }