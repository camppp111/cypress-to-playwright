describe('Complex Edge Cases', () => {
  // --- Deep chaining & subject passing ---
  it('should handle deeply nested command chains', () => {
    cy.visit('https://example.com');
    cy.get('body')
      .find('div')
      .find('h1')
      .should('be.visible')
      .and('have.text', 'Example Domain')
      .and('not.have.class', 'missing');
  });

  it('should preserve subject across multiple then() calls', () => {
    cy.visit('https://example.com');
    cy.get('h1')
      .invoke('text')
      .then((text: string) => {
        expect(text).to.equal('Example Domain');
      })
      .then(() => {
        expect(true).to.be.true;
      });
  });

  it('should handle chain after wrap', () => {
    cy.wrap({ nested: { value: 'deep' } })
      .its('nested.value')
      .should('equal', 'deep')
      .and('be.a', 'string');
  });

  // --- Multiple assertions in sequence on same subject ---
  it('should allow multiple sequential assertions without re-querying', () => {
    cy.visit('https://example.com');
    cy.get('h1')
      .should('exist')
      .and('be.visible')
      .and('have.text', 'Example Domain')
      .and('not.be.empty')
      .and('match', /Example/);
  });

  // --- Negated assertions ---
  it('should handle complex negated assertions', () => {
    cy.visit('https://example.com');
    cy.get('h1')
      .should('not.have.class', 'fake-class')
      .and('not.have.attr', 'disabled')
      .and('not.be.hidden');
    cy.get('body').should('not.contain.text', 'Definitely Not Here');
  });

  // --- Within scoping: nested & chained ---
  it('should support nested within blocks', () => {
    cy.visit('https://example.com');
    cy.get('body').within(() => {
      cy.get('div').within(() => {
        cy.get('h1').should('have.text', 'Example Domain');
      });
    });
  });

  it('should chain commands after within exits', () => {
    cy.visit('https://example.com');
    cy.get('body')
      .within(() => {
        cy.get('p').should('exist');
      })
      .find('h1')
      .should('have.text', 'Example Domain');
  });

  // --- Collection operations with edge cases ---
  it('should handle eq on single element', () => {
    cy.visit('https://example.com');
    cy.get('h1').eq(0).should('have.text', 'Example Domain');
  });

  it('should handle first/last on collections', () => {
    cy.visit('https://example.com');
    cy.get('a').first().should('have.attr', 'href');
    cy.get('a').last().should('have.attr', 'href');
  });

  it('should use each with async-like operations', () => {
    cy.visit('https://example.com');
    const texts: string[] = [];
    cy.get('a').each(($el: any) => {
      texts.push($el.prop('href'));
    }).then(() => {
      expect(texts.length).to.be.gte(1);
    });
  });

  // --- URL / navigation state tracking ---
  it('should track url changes across navigation', () => {
    cy.visit('https://example.com');
    cy.url().should('include', 'example.com');
    cy.title().should('not.be.empty');

    cy.visit('https://the-internet.herokuapp.com');
    cy.url().should('include', 'the-internet');
    cy.title().should('contain', 'Internet');
  });

  // --- invoke & its edge cases ---
  it('should invoke a method and chain from result', () => {
    cy.visit('https://example.com');
    cy.get('h1')
      .invoke('text')
      .should('equal', 'Example Domain')
      .and('be.a', 'string');
  });

  it('should use its on a wrapped object then chain', () => {
    cy.wrap([1, 2, 3])
      .its('length')
      .should('equal', 3)
      .and('be.above', 2);
  });

  // --- Complex traversal combinations ---
  it('should combine traversal commands in a single chain', () => {
    cy.visit('https://example.com');
    cy.get('h1')
      .parent()
      .children()
      .first()
      .next()
      .should('exist');
  });

  it('should use closest then find within result', () => {
    cy.visit('https://example.com');
    cy.get('h1')
      .closest('body')
      .find('p')
      .should('exist');
  });

  it('should use siblings and filter', () => {
    cy.visit('https://example.com');
    cy.get('h1')
      .siblings()
      .filter('p')
      .should('have.length.gte', 0);
  });

  // --- Asynchronous subject propagation ---
  it('should handle request then chain its result', () => {
    cy.request('https://example.com').its('status').should('equal', 200);
  });

  // --- has / not / is combinations ---
  it('should use has then not in sequence', () => {
    cy.visit('https://example.com');
    cy.get('body')
      .has('h1')
      .not('.nonexistent')
      .should('exist');
  });

  // --- Reload with assertion after ---
  it('should reload and assert state persists', () => {
    cy.visit('https://example.com');
    cy.reload();
    cy.get('h1').should('have.text', 'Example Domain');
    cy.reload(true); // force reload
    cy.url().should('include', 'example.com');
  });

  // --- Window & document interaction ---
  it('should use window and document in same test', () => {
    cy.visit('https://example.com');
    cy.window().its('location.href').should('include', 'example.com');
    cy.document().its('title').should('not.be.empty');
  });

  // --- Scroll into view + interaction ---
  it('should scroll then interact', () => {
    cy.visit('https://the-internet.herokuapp.com');
    cy.get('h1').scrollIntoView().should('be.visible');
  });

  // --- Multiple cy.get calls with different selectors ---
  it('should handle many independent gets without cross-contamination', () => {
    cy.visit('https://example.com');
    cy.get('h1').should('have.text', 'Example Domain');
    cy.get('p').should('exist');
    cy.get('a').should('have.attr', 'href');
    cy.get('body').should('exist');
  });

  // --- Chai-style expect standalone ---
  it('should support standalone expect on primitives', () => {
    expect(true).to.be.true;
    expect(false).to.not.be.true;
    expect(42).to.be.a('number');
    expect('hello').to.include('ell');
    expect([1, 2]).to.have.length(2);
  });

  // --- Complex type + assertion ---
  it('should type special characters and assert value', () => {
    cy.visit('https://the-internet.herokuapp.com/login');
    cy.get('input#username').type('tomsmith{tab}');
    cy.get('input#password').type('SuperSecretPassword!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', 'secure');
  });

  // --- then returning a new subject ---
  it('should allow then to transform subject', () => {
    cy.visit('https://example.com');
    cy.get('h1')
      .invoke('text')
      .then((text: string) => text.toUpperCase())
      .should('equal', 'EXAMPLE DOMAIN');
  });

  // ---log + chaining ---
  it('should log and continue chain', () => {
    cy.visit('https://example.com');
    cy.log('About to check heading');
    cy.get('h1').should('exist');
    cy.log('Heading found');
  });
});
