import cloudinary from "cloudinary";
import Tool from "./tool.model";
import { ServiceResponse } from "../../@types/api";

// ── CREATE ────────────────────────────────────────────────────────────
export const createTool = async (data: any, instructorId: string): Promise<ServiceResponse<any>> => {
  try {
    let thumbnail = { public_id: null as string | null, url: "" };

    if (data.thumbnail && typeof data.thumbnail === "string" && data.thumbnail.startsWith("data:")) {
      const result = await cloudinary.v2.uploader.upload(data.thumbnail, { folder: "tool-thumbnails" });
      thumbnail = { public_id: result.public_id, url: result.secure_url };
    } else if (data.thumbnail) {
      thumbnail.url = data.thumbnail;
    }

    const tool = await Tool.create({ ...data, instructor: instructorId, thumbnail });
    return { success: true, data: tool, message: "Tool created successfully" };
  } catch (error: any) {
    return { success: false, message: "Tool creation failed", errors: [error.message] };
  }
};

// ── UPDATE ────────────────────────────────────────────────────────────
export const updateTool = async (toolId: string, data: any, userId: string, userRole: string): Promise<ServiceResponse<any>> => {
  try {
    const tool = await Tool.findById(toolId);
    if (!tool) return { success: false, message: "Tool not found", errors: [] };
    if (userRole !== "admin" && tool.instructor.toString() !== userId) {
      return { success: false, message: "Unauthorized", errors: [] };
    }

    if (data.thumbnail && typeof data.thumbnail === "string") {
  if (data.thumbnail.startsWith("data:")) {
    // base64 image — cloudinary তে upload করো
    if (tool.thumbnail?.public_id) await cloudinary.v2.uploader.destroy(tool.thumbnail.public_id);
    const result = await cloudinary.v2.uploader.upload(data.thumbnail, { folder: "tool-thumbnails" });
    data.thumbnail = { public_id: result.public_id, url: result.secure_url };
  } else {
    // plain URL — object হিসেবে set করো ✅
    data.thumbnail = { public_id: null, url: data.thumbnail };
  }
}

    const updated = await Tool.findByIdAndUpdate(toolId, data, { new: true });
    return { success: true, data: updated, message: "Tool updated successfully" };
  } catch (error: any) {
    return { success: false, message: "Tool update failed", errors: [error.message] };
  }
};

// ── DELETE ────────────────────────────────────────────────────────────
export const deleteTool = async (toolId: string, userId: string, userRole: string): Promise<ServiceResponse<null>> => {
  try {
    const tool = await Tool.findById(toolId);
    if (!tool) return { success: false, message: "Tool not found", errors: [] };
    if (userRole !== "admin" && tool.instructor.toString() !== userId) {
      return { success: false, message: "Unauthorized", errors: [] };
    }
    if (tool.thumbnail?.public_id) await cloudinary.v2.uploader.destroy(tool.thumbnail.public_id);
    await Tool.findByIdAndDelete(toolId);
    return { success: true, data: null, message: "Tool deleted" };
  } catch (error: any) {
    return { success: false, message: "Tool deletion failed", errors: [error.message] };
  }
};

// ── GET ALL (published) ───────────────────────────────────────────────
export const getAllTools = async (): Promise<ServiceResponse<any>> => {
  try {
    const tools = await Tool.find({ status: "published" })
      .populate("instructor", "name avatar")
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, data: tools, message: "Tools retrieved" };
  } catch (error: any) {
    return { success: false, message: "Failed to retrieve tools", errors: [error.message] };
  }
};

// ── GET ALL (admin — all statuses) ───────────────────────────────────
export const getAllToolsAdmin = async (): Promise<ServiceResponse<any>> => {
  try {
    const tools = await Tool.find()
      .populate("instructor", "name avatar")
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, data: tools, message: "Tools retrieved" };
  } catch (error: any) {
    return { success: false, message: "Failed to retrieve tools", errors: [error.message] };
  }
};

// ── GET ONE ───────────────────────────────────────────────────────────
export const getToolById = async (toolId: string): Promise<ServiceResponse<any>> => {
  try {
    const tool = await Tool.findById(toolId).populate("instructor", "name avatar").lean();
    if (!tool) return { success: false, message: "Tool not found", errors: [] };
    return { success: true, data: tool, message: "Tool retrieved" };
  } catch (error: any) {
    return { success: false, message: "Failed to retrieve tool", errors: [error.message] };
  }
};