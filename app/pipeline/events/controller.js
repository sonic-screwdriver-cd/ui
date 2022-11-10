import Controller from '@ember/controller';
import { computed, get, set } from '@ember/object';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';
import uniqBy from 'lodash.uniqby';
import moment from 'moment';
import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import { isPRJob } from 'screwdriver-ui/utils/build';
import {
  SHOULD_RELOAD_SKIP,
  SHOULD_RELOAD_YES
} from '../../mixins/model-reloader';

export default Controller.extend(ModelReloaderMixin, {
  store: service(),
  router: service(),
  expandedEventsGroup: {},

  shouldReload(model) {
    let res = SHOULD_RELOAD_SKIP;

    if (this.isDestroyed || this.isDestroying) {
      const event = model.events.find(m => m.isRunning);

      let diff;
      const { lastRefreshed } = this;

      if (event) {
        res = SHOULD_RELOAD_YES;
      } else {
        diff = moment().diff(lastRefreshed, 'milliseconds');
        if (diff > this.reloadTimeout * 2) {
          res = SHOULD_RELOAD_YES;
        } else {
          res = SHOULD_RELOAD_SKIP;
        }
      }
    }

    return res;
  },
  queryParams: [
    {
      jobId: { type: 'string' }
    }
  ],
  jobId: '',
  session: service(),
  init() {
    this._super(...arguments);
    this.startReloading();
    this.set('eventsPage', 1);
  },
  showListView: false,
  showPRJobs: true,

  reload() {
    try {
      this.send('refreshModel');
    } catch (e) {
      return Promise.resolve(e);
    } finally {
      this.set('lastRefreshed', moment());
    }

    return Promise.resolve();
  },
  isShowingModal: false,
  activeTab: 'events',
  errorMessage: '',
  paginateEvents: [],

  willDestroy() {
    // FIXME: Never called when route is no longer active
    this.stopReloading();
  },
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER
});
