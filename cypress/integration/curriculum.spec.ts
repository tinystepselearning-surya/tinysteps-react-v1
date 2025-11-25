describe('Curriculum page — end-to-end', () => {
  before(() => {
    // assume dev server is running at baseUrl configured in cypress.json / package.json
  });

  it('shows speaking weeks (not phonics) when Speaking tab is clicked', () => {
    // Visit curriculum page (ensure we hit the dev server port Vite is using)
    cy.visit('http://localhost:5175/curriculum');

    // Ensure page loaded
    cy.contains('Curriculum Breakdown').should('be.visible');

    // Click Speaking tab
    cy.contains('button', 'Speaking').click();

    // Wait for WeekAccordion sections to appear
    cy.contains('Basic Public Speaking (12 weeks)').should('exist');
    cy.contains('Advanced Public Speaking (12 weeks)').should('exist');

    // Expect a known title from public-speaking-foundations to be present
    cy.contains('Week 1: Promises & Intro').should('exist');

    // Ensure phonics sample text (SATPIN) is NOT present inside the speaking sections
    cy.get('div').contains('SATPIN').should('not.exist');

    // Also assert the Basic Public Speaking panel contains at least 12 week titles
    cy.contains('Basic Public Speaking (12 weeks)').parent().within(() => {
      // WeekAccordion renders each week title in a span with .font-semibold.text-gray-900
      cy.get('span.font-semibold.text-gray-900').its('length').should('be.gte', 12);
    });
  });
});
