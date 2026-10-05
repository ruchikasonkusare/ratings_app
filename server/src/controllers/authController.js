const bcrypt = require('bcryptjs');
const prisma = require("../prisma");
const { validateName, validateEmail, validatePassword, validateAddress } = require('../utils/validation');
const jwt = require("jsonwebtoken");

const register = async(req,res)=>{
    try {
        const {name,email,password,address} = req.body;

        if(!name || !email || !password || !address){
            return res.status(400).json({success:false,message:"All fields are required"});
        }

        if(!validateName(name)){
            return res.status(400).json({success:false,message:"Name length should be minimum 20 and maximum 60 characters"});
        }
        if(!validateEmail(email)){
            return res.status(400).json({success:false,message:"Invalid email address"});
        }
        if(!validatePassword(password)){
            return res.status(400).json({success:false,message:"Password must contain 8-16 characters and must include at least one uppercase letter and one lowercase letter"});
        }
        if(!validateAddress(address)){
            return res.status(400).json({success:false,message:"Address length should less than 400 characters."});
        }

        const existingUser = await prisma.user.findUnique({
            where:{email}
        });
        if(existingUser){
            return res.status(409).json({success:false,message:"User already exists with this mail"});
        }
        const passwordHash = await bcrypt.hash(password,12);

        const user = await prisma.user.create({
            data:{
                name,
                email,
                passwordHash,
                address,
                role:"USER"
            }
        });

        return res.status(200).json({success:true,message:"User registered successfully",data:user});
    } catch (error) {
        return res.status(500).json({success:false,message:"Server error"});
    }
}

const login = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({message: "Email and password are required"});
      }
  
      const user = await prisma.user.findUnique({
        where: {email},
      });
  
      if (!user) {
        return res.status(401).json({message: "Invalid email or password"});
      }
  
      const isPasswordCorrect = await bcrypt.compare(password,user.passwordHash);
  
      if (!isPasswordCorrect) {
        return res.status(401).json({message: "Invalid email or password"});
      }
  
      const token = jwt.sign({
          userId: user.id,
          role: user.role,
        },process.env.JWT_SECRET,
        {expiresIn: "1h"}
      );
  
      return res.status(200).json({message: "Login successful",token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {  
      return res.status(500).json({message: "Server error"});
    }
  };

  const changePassword = async (req, res) => {
    try {
      const userId = req.user.userId;
  
      const {
        currentPassword,
        newPassword,
      } = req.body;
  
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message:
            "Current password and new password are required",
        });
      }
  
      const passwordRegex =
        /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;
  
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be 8-16 characters and include at least one uppercase letter and one special character",
        });
      }
  
      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be different from current password",
        });
      }
  
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      const isCurrentPasswordValid =
        await bcrypt.compare(
          currentPassword,
          user.passwordHash
        );
  
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message:
            "Current password is incorrect",
        });
      }
  
      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12
        );
  
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          passwordHash,
        },
      });
  
      return res.status(200).json({
        success: true,
        message:
          "Password changed successfully",
      });
    } catch (error) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );
  
      return res.status(500).json({
        success: false,
        message:
          "Failed to change password",
      });
    }
  };

module.exports = {
    register,
    login,
    changePassword
}