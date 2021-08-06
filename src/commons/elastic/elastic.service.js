import { Client } from 'elasticsearch';
import { logger } from '../utils';
import Axios from 'axios';

class Elastic {
  constructor(host = 'http://localhost:9200') {
    this.host = host;
    this.client = new Client({ host: host });
    Axios.get(host, { timeout: 5000 })
      .then((res) => {
        logger.info('All is well');
        this.active = true;
      })
      .catch((error) => {
        logger.error('elasticsearch cluster is down!');
        this.active = false;
      });
  }

  delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }
  async init({ model, populate = null, query = {} }) {
    await this.delay(5000);
    if (!this.active) return;
    try {
      // logger.info('Init elasticsearch %s', this.host);
      logger.info('[elasticsearch] Indexing for %s', model.collection.name);
      model.esCreateMapping(
        {
          settings: {
            max_ngram_diff: 20,
            analysis: {
              analyzer: {
                vi: {
                  type: 'custom',
                  tokenizer: 'standard' /* 'vi_tokenizer' */,
                  char_filter: ['html_strip'],
                  filter: ['icu_folding' /* , 'vi_nGram' */]
                },
                word_ngram: {
                  type: 'custom',
                  tokenizer: 'vi_nGram' /* 'vi_tokenizer' */,
                  // char_filter: ['html_strip'],
                  filter: ['icu_folding']
                }
              },
              tokenizer: {
                vi_nGram: {
                  type: 'ngram',
                  min_gram: 3,
                  max_gram: 10,
                  token_chars: ['letter', 'digit']
                }
              }
            }
          }
        },
        (err, mapping) => {
          if (mapping && mapping.acknowledged) {
            logger.info('create mapping successfully');
            logger.info('syncing...');
          } else {
            logger.error('error when create mapping: %o', err);
          }
        }
      );
      await this.delay(5000);
      // return;
      let i = 0;
      model.on('es-bulk-sent', function () {});

      model.on('es-bulk-data', function (doc) {
        i++;
      });

      model.on('es-bulk-error', function (err) {
        logger.error('bulk error: %o', err);
      });
      model.esSynchronize(query, null, { populate }).then(function () {
        logger.info('synced ' + i + ' docs from ' + model.collection.name);
      });
    } catch (e) {
      logger.error('error when sync: %o', e);
    }
  }
}

const elasticService = new Elastic(process.env.ELASTIC_HOST);
export default elasticService;
