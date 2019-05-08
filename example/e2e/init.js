const detox = require('detox');
const config = require('../../package.json').detox;
const adapter = require('detox/runners/jest/adapter');

jest.setTimeout(300000);
jasmine.getEnv().addReporter(adapter);

 beforeAll(async () => {
	await detox.init(config, { launchApp: false });
  await device.launchApp({ permissions:{ photos: 'YES' }});
});

 beforeEach(async () => {
  await adapter.beforeEach();
  // await device.launchApp({ permissions:{ photos: 'YES' }});
});

 afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
