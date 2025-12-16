import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body;
    if(!title || !description){
        throw new ApiError(400, "Title and description required.");
    }
    const videoLocalPath = req.files?.videoFile[0]?.path;
    console.log(videoLocalPath);

    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    console.log(thumbnailLocalPath);

    if (!videoLocalPath || !thumbnailLocalPath) {
         throw new ApiError(400, "Video and thumbnail is required.");
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    console.log(videoFile);
    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    console.log(thumbnail);
    

    if(!videoFile){
         throw new ApiError(400, "Video is required.");
    }
    if(!thumbnail){
         throw new ApiError(400, "Thumbnail is required.");
    }

    const owner = req.user._id;
    //console.log(owner);

    const duration = videoFile?.duration;
    //console.log(duration);
    if (!duration || duration < 1) {
        throw new ApiError(400, "Video duration must be at least 1 second.");
    }
    

    // TODO: get video, upload to cloudinary, create video

    const newVideo = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner,
        title,
        description,
        duration,
        views: 0,
        isPublished: true
    });

    //console.log(newVideo);
    return res.status(200)
    .json(new ApiResponse(200, newVideo, "Video published successfully."))
    
})

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id
    const { videoId } = req.params;
    if(!videoId){
        throw new ApiError(400, "The video does not exist.")
    }

    const video = await Video.findById(videoId);
    //console.log(video);

    return res.status(200).json(
        new ApiResponse(200, video, "The video is fetched successfully.")
    )
    
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video
    const { videoId } = req.params;
    if(!videoId){
        throw new ApiError(404, "The video does not exist.")
    }

    const video = await Video.findByIdAndDelete(videoId);
    console.log(video);
    return res.status(200).json(
        new ApiResponse(200, video, "The video is deleted successfully.")
    )
    
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}