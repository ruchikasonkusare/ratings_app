function validateName(name){
    return name && name.length>=20 && name.length<=60;
}

function validateAddress(address){
    return address && address.length<=400;
}

function validatePassword(password) {
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;
  
    return passwordRegex.test(password);
  }
    
function validateEmail(email){
    const emailRegrex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegrex.test(email)
}

module.exports={
    validateAddress,
    validateName,
    validatePassword,
    validateEmail
};