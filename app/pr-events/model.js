import { computed, observer, get, set } from '@ember/object';
import { sort, not } from '@ember/object/computed';
import DS from 'ember-data';
import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import { isActiveBuild } from 'screwdriver-ui/utils/build';
import EventModel from 'screwdriver-ui/event';

export default DS.Model.extend(EventModel, {
});
