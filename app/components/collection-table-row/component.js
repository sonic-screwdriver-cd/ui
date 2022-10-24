import { computed } from '@ember/object';
import Component from '@ember/component';
import { and } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { formatMetrics } from 'screwdriver-ui/utils/metric';
import templateHelper from 'screwdriver-ui/utils/template';
const { getLastUpdatedTime } = templateHelper;

export default Component.extend({
  store: service(),
  inViewport: service(),
  tagName: 'tr',
  eventsInfo: null,
  lastEventInfo: null,
  isAuthenticated: false,
  isOrganizing: false,
  isDefaultCollection: false,
  pipeline: null,
  pipelineSelected: false,
  reset: false,
  storeQueryError: false,
  hasBothEventsAndLatestEventInfo: and('eventsInfo', 'lastEventInfo'),
  showCheckbox: and('isOrganizing', 'isAuthenticated'),

  aliasName: computed('pipeline.settings.aliasName', function get() {
    return this.pipeline.settings.aliasName === undefined
      ? ''
      : this.pipeline.settings.aliasName;
  }),
  branch: computed('pipeline.scmRepo', function get() {
    const { branch, rootDir } = this.pipeline.scmRepo;

    return rootDir ? `${branch}#${rootDir}` : branch;
  }),
  lastRun: computed('lastRun', 'pipeline', function get() {
    const { createTime } = this.pipeline;
    const lastRun = getLastUpdatedTime({
      createTime
    });

    return lastRun;
  }),
  showRemoveButton: computed(
    'isOrganizing',
    'isAuthenticated',
    'isDefaultCollection',
    function showRemoveButton() {
      return (
        !this.isDefaultCollection && !this.isOrganizing && this.isAuthenticated
      );
    }
  ),

  didInsertElement() {
    this._super(...arguments);
    if (!this.hasBothEventsAndLatestEventInfo) {
      this.setupInViewport();
    }
  },
  setupInViewport() {
    if (this && this.element) {
      const inViewportHook = this.element.querySelector('.branch');
      const { onEnter } = this.inViewport.watchElement(inViewportHook);

      onEnter(this.didEnterViewport.bind(this));
    }
  },
  async didEnterViewport() {
    if (this && this.element) {
      const inViewportHook = this.element.querySelector('.branch');

      this.inViewport.stopWatching(inViewportHook);
      this.updateEventMetrics();
    }
  },
  async updateEventMetrics() {
    const metrics = await this.pipeline.get('metrics').catch(() => {
      this.setProperties({
        storeQueryError: true
      });
    });

    const result = formatMetrics(metrics);
    const { eventsInfo, lastEventInfo } = result;

    this.setProperties({
      eventsInfo,
      lastEventInfo
    });
  },

  actions: {
    removePipeline() {
      this.removePipeline(this.pipeline.id, this.pipeline.name);
    },
    togglePipeline() {
      const pipelineId = this.pipeline.id;

      if (this.reset) {
        this.setProperties({
          pipelineSelected: false,
          reset: false
        });
      }

      if (this.pipelineSelected) {
        this.set('pipelineSelected', false);
        this.deselectPipeline(pipelineId);
      } else {
        this.set('pipelineSelected', true);
        this.selectPipeline(pipelineId);
      }
    }
  }
});
