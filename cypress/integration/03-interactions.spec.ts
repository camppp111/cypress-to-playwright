describe('Interactions', () => {
  it('should click on an element', () => {
    cy.visit('https://example.com');
    cy.get('a').first().click();
  });

  it('should type into an input', () => {
    cy.visit('https://the-internet.herokuapp.com/login');
    cy.get('#username').type('testuser');
  });

  it('should clear an input', () => {
    cy.visit('https://the-internet.herokuapp.com/login');
    cy.get('#username').type('test input').clear();
  });

  it('should click with force option', () => {
    cy.visit('https://example.com');
    cy.get('a').first().click({ force: true });
  });
});
