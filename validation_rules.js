var rules = {};

// user registration from the registration form

rules.login = {
    username: 'required',
    password: 'required'    
};

rules.signup = {
    fname: 'required',
    lname: 'required',
    email: 'required',
    password: 'required'
};

rules.verify_otp = {
    mobileNo: 'required',
    otp: 'required',
    userId: 'required'
};

rules.validate_account = {
    adharNumber: 'required',
    emiAmount: 'required',
    userId: 'required'
};

rules.add_password = {
    password: 'required',
    userId: 'required'
};

rules.add_security = {
    securityQuestion: 'required',
    answer: 'required',
    userId: 'required'
};

rules.resend_otp = {
    mobileNo: 'required'
};


rules.validate_security_question = {
    securityQuestion: 'required',
    answer: 'required',
};

rules.verify_change_password = {
    oldPassword: 'required',
    password: 'required'
};

rules.add_new_password = {
    password: "required"
};

rules.change_password = {
    password: "required"
};

rules.sync = {
    file: 'required'
};

rules.updateFCM = {
    deviceToken: 'required'
};

rules.edit_profile = {
    applicantFName: 'required',
    applicantMName: 'required',
    homeAddress: 'required'
};

rules.addTutorial = {
    tutorialTitle: 'required',
    mediaType: 'required',
    sequence: 'required',
    language: 'required',
    status: 'required'
};

rules.loanRequest = {
    amount: 'required',
    loanType: 'required'
};

rules.feedback = {
    category: 'required',
    description: 'required'
};

rules.refer_customer = {
    name: 'required',
    mobileNo: 'required',
    town : 'required',
};


module.exports.rules = rules;