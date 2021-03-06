import request from 'request-promise-native';
import Logger from './logger';

let lastPrice = process.env.INITIAL_GAS_PRICE;

/**
 * the gas price returned from the API gives the gas prices by gwei*10 for some reason
 * so we multiply by 1e8, not 1e9
 */
export async function updateGasPrice() {
  let response;
  try {
    response = await getGasPrices();
  } catch (error) {
    Logger.error({
      at: 'getGasPrices',
      message: 'Failed to retrieve gas prices',
      error,
    });
    return;
  }

  const { fast } = response;
  if (!fast) {
    Logger.error({
      at: 'updateGasPrice',
      message: 'gas api did not return fast',
    });
    return;
  }

  const multiplier = Number(process.env.GAS_PRICE_MULTIPLIER);
  if (Number.isNaN(multiplier)) {
    throw new Error('GAS_PRICE_MULTIPLIER not specified');
  }

  const totalWei = `${Math.round(Number(fast) * multiplier * 100000000)}`;

  Logger.info({
    at: 'updateGasPrice',
    message: 'Updating gas price',
    gasPrice: totalWei,
  });

  lastPrice = totalWei;
}

export function getGasPrice() {
  return lastPrice;
}

async function getGasPrices() {
  Logger.info({
    at: 'getGasPrices',
    message: 'Fetching gas prices',
  });

  const response = await request({
    method: 'GET',
    uri: process.env.GAS_STATION_URL,
    timeout: process.env.GAS_REQUEST_TIMEOUT_MS,
  });
  return JSON.parse(response);
}
