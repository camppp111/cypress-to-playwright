describe('Comprehensive Command Coverage', () => {
  it('should chain multiple commands', () => {
    cy.visit('https://example.com');
    cy.get('body')
      .find('h1')
      .should('exist')
      .and('be.visible')
      .and('have.text', 'Example Domain');
  });

  it('should use within with find and traversal', () => {
    cy.visit('https://example.com');
    cy.get('body').within(() => {
      cy.get('p').should('exist');
      cy.contains('More').should('exist');
    });
  });

  it('should use first and eq', () => {
    cy.visit('https://example.com');
    cy.get('a').first().should('exist');
    cy.get('a').eq(0).should('exist');
  });

  it('should use filter', () => {
    cy.visit('https://example.com');
    cy.get('body').find('a').filter('a[href]').should('exist');
  });

  it('should use parent and children together', () => {
    cy.visit('https://example.com');
    cy.get('h1').parent().children().should('have.length.gte', 1);
  });

  it('should use next and prev together', () => {
    cy.visit('https://example.com');
    cy.get('h1').next().prev().should('exist');
  });

  it('should use siblings', () => {
    cy.visit('https://example.com');
    cy.get('h1').siblings().should('have.length.gte', 0);
  });

  it('should use closest', () => {
    cy.visit('https://example.com');
    cy.get('h1').closest('body').should('exist');
  });

  it('should use has and is', () => {
    cy.visit('https://example.com');
    cy.get('body').has('p').should('exist');
  });

  it('should use not', () => {
    cy.visit('https://example.com');
    cy.get('body').find('div').not('.nonexistent').should('have.length.gte', 0);
  });

  it('should use its for properties', () => {
    cy.visit('https://example.com');
    cy.get('a').its('href').should('exist');
    cy.get('p').its('length').should('be.gte', 1);
  });

  it('should use hasClass', () => {
    cy.visit('https://example.com');
    cy.get('body').hasClass('example').then((result: boolean) => {
      expect(typeof result).to.equal('boolean');
    });
  });

  it('should use viewport', () => {
    cy.viewport(1280, 720);
    cy.visit('https://example.com');
  });

  it('should use reload', () => {
    cy.visit('https://example.com');
    cy.reload();
    cy.url().should('include', 'example.com');
  });

  it('should use title and url', () => {
    cy.visit('https://example.com');
    cy.title().should('not.be.empty');
    cy.url().should('include', 'example.com');
  });

  it('should use log', () => {
    cy.log('Test message');
  });

  it('should use wrap', () => {
    cy.wrap({ foo: 'bar' }).its('foo').should('equal', 'bar');
  });

  it('should use request', () => {
    cy.request('https://example.com').its('status').should('equal', 200);
  });

  it('should use window', () => {
    cy.visit('https://example.com');
    cy.window().its('location').should('exist');
  });

  it('should use scrollIntoView', () => {
    cy.visit('https://example.com');
    cy.get('body').scrollIntoView();
  });

  it('should use trigger', () => {
    cy.visit('https://example.com');
    cy.get('body').trigger('mouseover');
  });

  it('should use invoke', () => {
    cy.visit('https://example.com');
    cy.get('h1').invoke('text').should('exist');
  });
});
