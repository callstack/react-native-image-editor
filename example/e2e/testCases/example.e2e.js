
it('finds no permission text in example app', async () => {
  await expect(element(by.id('headerText'))).toBeVisible();
});
