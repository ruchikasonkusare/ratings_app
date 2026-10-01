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

        if(!validateName){
            return res.status(400).json({success:false,message:"Name length should be minimum 20 and maximum 60 characters"});
        }
        if(!validateEmail){
            return res.status(400).json({success:false,message:"Invalid email address"});
        }
        if(!validatePassword){
            return res.status(400).json({success:false,message:"Password must contain 8-16 characters and must include at least one uppercase letter and one lowercase letter"});
        }
        if(!validateAddress){
            return res.status(400).json({success:false,message:"Address length should less than 400 characters."});
        }

        const existingUser = await prisma.user.findUnique({
            where:{email}
        });
        if(existingUser){
            return res.status(409).json({success:false,message:"User already exists with this mail"});
        }
        const passwordHash = await bcrypt.hash(password,12);

        const user = prisma.user.create({
            data:{
                name,
                email,
                passwordHash,
                address,
                role:"USER"
            }
        });

        return res.status(200).json({success:true,message:"User registered successfully",data:user.data});
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

module.exports = {
    register,
    login
}