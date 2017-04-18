// login.page.js
var Lab6 = function() {
    var self = this;

    // self.usernameInput = browser.findElement(by.name('username'));
    // self.passwordInput = browser.findElement(by.name('password'));
    // self.emailInput = browser.findElement(by.name('email'));
    self.submitButton = element(by.css('input[type="submit"]'));
    self.usernameInput = element(by.css('input[name="username"]'));
    self.passwordInput = element(by.css('input[name="password"]'));
    self.emailInput = element(by.css('input[name="email"]'));
    self.colorInput = element(by.css('input[name="color"]'));

    self.saveButton = element(by.buttonText('Save'));
    self.deleteButton = element(by.partialButtonText('Delete'));

    self.signUpLink = element(by.css('a[href="/signup"]'));
    self.editUserLink = element(by.css('a[href="/user"]'));
    self.logoutLink = element(by.css('a[href="/logout"]'));
    self.homeLink = element(by.css('a[href="/"]'));

    self.bodyForResponse = element(by.css('body'))

    self.login = function(user, pass) {
        var username = user || '123';
        var password = pass || '123';
        self.usernameInput.sendKeys(username);
        self.passwordInput.sendKeys(password);
        self.submitButton.click();
    }
};
module.exports = new Lab6();
