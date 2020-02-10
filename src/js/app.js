import {app} from './bf/base.js';
import {config} from './config.js';

app.overrideData(config.data);
app.trigger('app:ready',app.get('helpers.html').data('app'));