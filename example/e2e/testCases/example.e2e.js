it('finds example text', async () => {
  await expect(element(by.id('headerText'))).toBeVisible();
});
