describe('Forms', () => {
  it('should check a checkbox', () => {
    cy.visit('https://the-internet.herokuapp.com/checkboxes');
    cy.get('input[type="checkbox"]').first().check();
  });

  it('should check a checkbox with force option', () => {
    cy.visit('https://the-internet.herokuapp.com/checkboxes');
    cy.get('input[type="checkbox"]').first().check({ force: true });
  });

  it('should uncheck a checkbox', () => {
    cy.visit('https://the-internet.herokuapp.com/checkboxes');
    cy.get('input[type="checkbox"]').first().uncheck();
  });

  it('should select an option from a dropdown', () => {
    cy.visit('https://the-internet.herokuapp.com/dropdown');
    cy.get('select').select('Option 1');
  });

  it('should type and clear in a form input', () => {
    cy.visit('https://the-internet.herokuapp.com/login');
    cy.get('input[name="username"]').type('tomsmith').clear();
  });
});
