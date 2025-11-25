describe('Curriculum page - sanity checks', () => {
  it('speaking tab shows speaking weeks and not phonics weeks', () => {
    // Visit the curriculum route
    cy.visit('/curriculum');

    // Click the Speaking tab
    cy.contains('button', 'Speaking', { timeout: 10000 }).click();

    // Check speaking section headers
    cy.contains('Basic Public Speaking (12 weeks)', { timeout: 10000 }).should('be.visible');
    cy.contains('Advanced Public Speaking (12 weeks)').should('be.visible');

    // Confirm speaking week titles from curriculum-v2.1.json are present
    cy.contains('Week 1: Promises & Intro', { timeout: 10000 }).should('be.visible');
    cy.contains('Week 1: S.P.E.A.K. + Baseline').should('be.visible');

    // Ensure no SATPIN (phonics) content is shown within the speaking tab
    cy.contains('SATPIN').should('not.exist');
  });

  it('phonics tab shows expected phonics week (SATPIN)', () => {
    cy.visit('/curriculum');
    cy.contains('button', 'Phonics', { timeout: 10000 }).click();
    cy.contains('Early Phonics (12 weeks)').should('be.visible');
    cy.contains('Week 1: SATPIN Set 1', { timeout: 10000 }).should('be.visible');
  });
});
