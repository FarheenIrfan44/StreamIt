import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessandRefreshTokens = async(userId) => {
    try {
       const user =  await User.findById(userId)
       const accessToken = user.generateAccessToken();
       const refreshToken = user.generateRefreshToken();

       user.refreshToken = refreshToken;
       await user.save({validateBeforeSave: false});
       return {accessToken, refreshToken}       
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token.")
        
    }
}

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existingUser) {
    throw new ApiError(409, "User already exists.");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //console.log(avatarLocalPath);
  
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required.");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  //console.log(avatar);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required.");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user.");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created."));
});

const loginUser = asyncHandler(async (req,res) => {
    //Get data from frontend
    //check credentials - check password in mongodb
    //if credentials match toh give user an access token && refresh token
    //save refresh token in db
    // Give refersh token again after expiry time.

    const {email, username, password} = req.body;
    if(!username || !email){
        throw new ApiError(400, "User or password is required")
    }

   const user =  await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist.")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Password is not correct.")
    }

    const {accessToken, refreshToken} = await generateAccessandRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookies("refreshToken", refreshToken, options)
    .json( new ApiResponse(200, {
        user: loggedInUser, accessToken, refreshToken
    }, 
    "User Logged in successfully."))
})

const logout = asyncHandler(async(req,res) => {
   User.findByIdAndUpdate(
     req.user._id,
     {
        $set: {refreshToken: undefined}
     },{
        new: true
     }
   )

   const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookies("accessToken", options)
    .clearCookies("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out." ))



})
export { registerUser, loginUser, logout };
