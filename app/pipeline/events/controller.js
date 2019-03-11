import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';

import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import { isPRJob } from 'screwdriver-ui/utils/build';

export default Controller.extend(ModelReloaderMixin, {
  session: service(),
  prEventsService: service('pr-events'),
  init() {
    this._super(...arguments);
    this.startReloading();
    this.set('eventsPage', 1);
  },

  reload() {
    try {
      this.send('refreshModel');
    } catch (e) {
      return Promise.resolve(e);
    }

    return Promise.resolve();
  },
  isShowingModal: false,
  isFetching: false,
  activeTab: 'events',
  moreToShow: true,
  errorMessage: '',
  jobs: computed('model.jobs', {
    get() {
      const jobs = this.get('model.jobs');

      return jobs.filter(j => !isPRJob(j.get('name')));
    }
  }),
  prJobs: computed('model.jobs', {
    get() {
      console.log('prJobs!!!!!');
      const jobs = this.get('model.jobs');

      return jobs.filter(j => isPRJob(j.get('name')));
    }
  }),
  latestPRevents: [],
  updatePRevents: computed('prJobs', 'prJobs.@each.lastBuild', {
    get() {
      const prJobs = this.get('prJobs');

      return Promise.all(prJobs.map((job) => {
        return this.get('prEventsService').getLatestPRjobEvent(job);
      })).then((events) => {
        events.forEach((e) => {
          console.log('latestPRevent.buildId:', get(e, 'buildId'));
        });
        this.set('latestPRevents', events);
      });
    }
  }),
  paginateEvents: [],
  currentEventType: computed('activeTab', {
    get() {
      return this.get('activeTab') === 'pulls' ? 'pr' : 'pipeline';
    }
  }),
  // Aggregates first page events and events via ModelReloaderMixin
  modelEvents: computed('model.events', 'currentEventType', {
    get() {
      let previousModelEvents = this.get('previousModelEvents') || [];
      let currentModelEvents = this.get('model.events').toArray();
      let newModelEvents = [];
      const newPipelineId = this.get('pipeline.id');
      console.log('currentModelEvents', currentModelEvents);
      console.log('previousModelEvents', previousModelEvents);

      // purge unmatched pipeline events
      if (previousModelEvents.some(e => e.get('pipelineId') !== newPipelineId)
         || previousModelEvents.some(e => e.get('type') !== this.get('currentEventType'))) {
        newModelEvents = [...currentModelEvents];
        console.log('mode changed!!!');

        this.set('paginateEvents', []);
        this.set('previousModelEvents', newModelEvents);
        this.set('moreToShow', true);
        this.set('eventsPage', 1);

        return newModelEvents;
      }

      previousModelEvents = previousModelEvents
        .filter(e => e.type === this.get('currentEventType'))
        .filter(e => !currentModelEvents.find(c => c.id === e.id));

      newModelEvents = currentModelEvents.concat(previousModelEvents);

      this.set('previousModelEvents', newModelEvents);

      return newModelEvents;
    }
  }),
  // Aggregates first page events and events via ModelReloaderMixin
  prChainEnabled: computed('pipeline.prChain', {
    get() {
      return this.get('pipeline.prChain');
    }
  }),
  events: computed('modelEvents', 'paginateEvents', 'latestPRevents', {
    get() {
      console.log('events changed!!!');
      console.log(this.get('latestPRevents'));
      return [].concat(this.get('modelEvents'), this.get('paginateEvents'), this.get('latestPRevents'));
    }
  }),
  pullRequests: computed('model.jobs', {
    get() {
      const jobs = this.get('model.jobs');

      return jobs.filter(j => isPRJob(j.get('name'))).sortBy('createTime').reverse();
    }
  }),
  selectedEvent: computed('selected', 'mostRecent', {
    get() {
      return get(this, 'selected') || get(this, 'mostRecent');
    }
  }),

  selectedEventObj: computed('selectedEvent', {
    get() {
      const selected = get(this, 'selectedEvent');

      if (selected === 'aggregate') {
        return null;
      }
      const events = [].concat(get(this, 'events'));

      return events.find(e => get(e, 'id') === selected);
    }
  }),

  mostRecent: computed('events.[]', {
    get() {
      const list = get(this, 'events');

      if (Array.isArray(list) && list.length) {
        const id = get(list[0], 'id');

        return id;
      }

      return 0;
    }
  }),

  lastSuccessful: computed('events.@each.status', {
    get() {
      const list = get(this, 'events') || [];
      const event = list.find(e => get(e, 'status') === 'SUCCESS');

      if (!event) {
        return 0;
      }

      return get(event, 'id');
    }
  }),

  updateEvents(page) {
    if (this.get('currentEventType') === 'pr') {
      return;
    }
    this.set('isFetching', true);

    return get(this, 'store').query('event', {
      pipelineId: get(this, 'pipeline.id'),
      type: get(this, 'currentEventType'),
      page,
      count: ENV.APP.NUM_EVENTS_LISTED
    })
      .then((events) => {
        const nextEvents = events.toArray();

        if (Array.isArray(nextEvents)) {
          if (nextEvents.length < ENV.APP.NUM_EVENTS_LISTED) {
            this.set('moreToShow', false);
          }
          console.log('nextEvents.length', nextEvents.length);

          this.set('eventsPage', page);
          this.set('isFetching', false);

          // FIXME: Skip duplicate ones if new events got added added to the head
          // of events list
          this.set('paginateEvents',
            this.get('paginateEvents').concat(nextEvents));
        }
      });
  },

  checkForMorePage({ scrollTop, scrollHeight, clientHeight }) {
    if (scrollTop + clientHeight > scrollHeight - 300) {
      this.updateEvents(this.get('eventsPage') + 1);
    }
  },

  actions: {
    updateEvents(page) {
      this.updateEvents(page);
    },

    onEventListScroll({ currentTarget }) {
      console.log('onEventListScroll: moreToShow? and isFetching?', this.get('moreToShow'), this.get('isFetching'));
      if (this.get('moreToShow') && !this.get('isFetching') ) {
        this.checkForMorePage(currentTarget);
      }
    },

    startMainBuild() {
      this.set('isShowingModal', true);

      const pipelineId = this.get('pipeline.id');
      const newEvent = this.store.createRecord('event', {
        pipelineId,
        startFrom: '~commit'
      });

      return newEvent.save().then(() => {
        this.set('isShowingModal', false);
        this.forceReload();

        return this.transitionToRoute('pipeline', newEvent.get('pipelineId'));
      }).catch((e) => {
        this.set('isShowingModal', false);
        this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
      });
    },
    startDetachedBuild(job) {
      const buildId = get(job, 'buildId');
      let parentBuildId = null;

      if (buildId) {
        const build = this.store.peekRecord('build', buildId);

        parentBuildId = get(build, 'parentBuildId');
      }

      const event = get(this, 'selectedEventObj');
      const parentEventId = get(event, 'id');
      const startFrom = get(job, 'name');
      const pipelineId = get(this, 'pipeline.id');
      const type = get(this, 'currentEventType');
      const token = get(this, 'session.data.authenticated.token');
      const user = get(decoder(token), 'username');
      const causeMessage =
        `${user} clicked restart for job "${job.name}" for sha ${get(event, 'sha')}`;
      const newEvent = this.store.createRecord('event', {
        buildId,
        pipelineId,
        type,
        startFrom,
        parentBuildId,
        parentEventId,
        causeMessage
      });

      this.set('isShowingModal', true);

      console.log('startDetachedBuild');
      return newEvent.save().then(() => {
        this.set('isShowingModal', false);
        console.log('modelToReload:', this.get('modelToReload'));
        this.forceReload();

        const path = `pipeline/${newEvent.get('pipelineId')}`;

        console.log('transitionToRoute', path);
        return this.transitionToRoute('pipeline', newEvent.get('pipelineId'));
      }).catch((e) => {
        this.set('isShowingModal', false);
        this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
      });
    }
  },
  willDestroy() {
    // FIXME: Never called when route is no longer active
    this.stopReloading();
  },
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER
});
