// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

// Custom command: add a simple greeting command
Cypress.Commands.add('greeting', (name: string) => {
  cy.log(`Hello, ${name}!`);
});

// Custom command: add a command with previous subject
Cypress.Commands.add('doubleClick', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).click().click();
});

// Custom command: overwrite the visit command to add logging
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  cy.log(`Visiting: ${url}`);
  return originalFn(url, options);
});
