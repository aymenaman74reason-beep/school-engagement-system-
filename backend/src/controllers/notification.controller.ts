import { Request, Response } from "express";
import { Notification, Announcement, Message, User, StudentProfile, ParentProfile } from "../models";
import { asyncHandler, ApiResponse, parsePaginationQuery } from "../utils";
import { NotFoundError, ForbiddenError } from "../utils/errors";
import { MESSAGES } from "../constants";
import { createAuditLog } from "../middleware/audit.middleware";
import { uploadToCloudinary } from "../middleware/upload.middleware";

export class NotificationController {
  /** Get notifications for authenticated user. */
  getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const filter: any = { recipientId: req.user!._id };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.isRead !== undefined)
      filter.isRead = req.query.isRead === "true";

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort(sort).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        recipientId: req.user!._id,
        isRead: false,
      }),
    ]);

    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Notifications"),
      data: { notifications, unreadCount },
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  /** Mark notification as read. */
  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user!._id },
      { isRead: true, readAt: new Date() },
      { new: true },
    );
    if (!notification)
      throw new NotFoundError(MESSAGES.NOT_FOUND("Notification"));
    ApiResponse.success(res, {
      message: MESSAGES.MARKED_AS_READ,
      data: notification,
    });
  });

  /** Mark all notifications as read. */
  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    await Notification.updateMany(
      { recipientId: req.user!._id, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    ApiResponse.success(res, { message: MESSAGES.MARKED_AS_READ });
  });

  /** Create a notification (system/admin use). */
  createNotification = asyncHandler(async (req: Request, res: Response) => {
    const notification = await Notification.create({
      ...req.body,
      senderId: req.user!._id,
    });
    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.NOTIFICATION_SENT,
      data: notification,
    });
  });
}

export class AnnouncementController {
  /** Create an announcement. */
  createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const uploadedAttachments: string[] = [];

    if (req.files && Array.isArray(req.files)) {
      for (const file of (req.files as Express.Multer.File[])) {
        const result = await uploadToCloudinary(
          file.buffer,
          "announcements",
          file.mimetype
        );
        uploadedAttachments.push(result.secure_url);
      }
    }

    const announcement = await Announcement.create({
      ...req.body,
      attachments: req.body.attachments ? [...req.body.attachments, ...uploadedAttachments] : uploadedAttachments,
      createdBy: req.user!._id,
    });

    // Notify target users
    const userFilter: any = {};
    if (req.body.targetRole && req.body.targetRole !== "all") {
      userFilter.role = req.body.targetRole;
    }
    
    // We fetch users to notify them. This might be slow for huge schools, but it's reliable.
    const usersToNotify = await User.find(userFilter);
    const senderName = `${(req.user as any).firstName} ${(req.user as any).lastName}`;
    const notifications = usersToNotify.map(u => ({
      recipientId: u._id,
      senderId: req.user!._id,
      title: `New Announcement: ${announcement.title}`,
      message: `${senderName} posted a new announcement for ${announcement.targetRole === "all" ? "everyone" : announcement.targetRole + "s"}.`,
      type: "announcement",
      relatedId: announcement._id
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "ANNOUNCEMENT_CREATED",
      entity: "Announcement",
      entityId: announcement._id,
      ipAddress: req.ip,
    });
    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.CREATED("Announcement"),
      data: announcement,
    });
  });

  /** Get announcements (filtered by role visibility). */
  getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const user = req.user!;
    const filter: any = { isActive: true };

    const roleOrAll = ["all", user.role];
    const roleFilter: any = { targetRole: { $in: roleOrAll } };
    
    if (user.role === "student") {
      const profile = await StudentProfile.findOne({ userId: user._id });
      roleFilter.$or = [
        { targetRole: "all" },
        { targetRole: "student" }
      ];
      if (profile?.classId) {
        roleFilter.$or.push(
          { targetClassId: profile.classId },
          { targetClassId: { $exists: false } },
          { targetClassId: null }
        );
      }
    }
    
    if (user.role === "parent") {
      const profile = await ParentProfile.findOne({ userId: user._id });
      roleFilter.$or = [
        { targetRole: "all" },
        { targetRole: "parent" }
      ];
      if (profile?.childrenIds?.length) {
        const childrenProfiles = await StudentProfile.find({ userId: { $in: profile.childrenIds } });
        const classIds = childrenProfiles.map((p: any) => p.classId).filter(Boolean);
        roleFilter.$or.push(
          { targetClassId: { $in: classIds } },
          { targetClassId: { $exists: false } },
          { targetClassId: null }
        );
      }
    }

    Object.assign(filter, roleFilter);

    if (req.query.priority) filter.priority = req.query.priority;

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate("createdBy", "firstName lastName")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Announcement.countDocuments(filter),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Announcements"),
      data: announcements,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  /** Get a single announcement. */
  getAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const announcement = await Announcement.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName",
    );
    if (!announcement)
      throw new NotFoundError(MESSAGES.NOT_FOUND("Announcement"));
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Announcement"),
      data: announcement,
    });
  });

  /** Update an announcement. */
  updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!announcement)
      throw new NotFoundError(MESSAGES.NOT_FOUND("Announcement"));
    ApiResponse.success(res, {
      message: MESSAGES.UPDATED("Announcement"),
      data: announcement,
    });
  });

  /** Delete an announcement (soft). */
  deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true },
    );
    if (!announcement)
      throw new NotFoundError(MESSAGES.NOT_FOUND("Announcement"));
    ApiResponse.success(res, { message: MESSAGES.DELETED("Announcement") });
  });
}

export class MessageController {
  /** Send a message. */
  sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const threadId =
      req.body.threadId ||
      `thread_${req.user!._id}_${req.body.receiverId}_${Date.now()}`;
    const message = await Message.create({
      ...req.body,
      senderId: req.user!._id,
      threadId,
    });

    // Create a notification for the recipient
    let notificationMsg = `${(req.user as any).firstName} ${(req.user as any).lastName} (${req.user!.role}) sent you a message.`;
    
    if (req.user!.role === "parent") {
      const pProfile = await ParentProfile.findOne({ userId: req.user!._id }).populate("childrenIds", "firstName lastName");
      if (pProfile && pProfile.childrenIds.length > 0) {
        const childNames = pProfile.childrenIds.map((c: any) => `${c.firstName} ${c.lastName}`).join(", ");
        notificationMsg = `Parent ${(req.user as any).firstName} ${(req.user as any).lastName} (Child: ${childNames}) sent you a message.`;
      }
    }

    await Notification.create({
      recipientId: req.body.receiverId,
      senderId: req.user!._id,
      title: `New Message: ${req.body.subject || "No Subject"}`,
      message: notificationMsg,
      type: "message",
      relatedId: message._id
    });

    await createAuditLog({
      actor: req.user!._id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: "MESSAGE_SENT",
      entity: "Message",
      entityId: message._id,
      metadata: { receiverId: req.body.receiverId },
      ipAddress: req.ip,
    });
    ApiResponse.success(res, {
      statusCode: 201,
      message: MESSAGES.CREATED("Message"),
      data: message,
    });
  });

  /** Get messages (inbox). */
  getMessages = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip, sort } = parsePaginationQuery(req);
    const userId = req.user!._id;
    const filter: any = {
      $or: [{ senderId: userId }, { receiverId: userId }],
    };
    if (req.query.threadId) filter.threadId = req.query.threadId;

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .populate("senderId", "firstName lastName role")
        .populate("receiverId", "firstName lastName role")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Message.countDocuments(filter),
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Messages"),
      data: messages,
      pagination: ApiResponse.buildPagination(page, limit, total),
    });
  });

  /** Mark message as read. */
  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, receiverId: req.user!._id },
      { isRead: true, readAt: new Date() },
      { new: true },
    );
    if (!message) throw new NotFoundError(MESSAGES.NOT_FOUND("Message"));
    ApiResponse.success(res, {
      message: MESSAGES.MARKED_AS_READ,
      data: message,
    });
  });

  /** Get conversation threads. */
  getThreads = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const threads = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
          isDeleted: false,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$threadId",
          lastMessage: { $first: "$$ROOT" },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", userId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { 
            senderId: "$lastMessage.senderId",
            receiverId: "$lastMessage.receiverId"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $cond: [
                    { $eq: ["$$senderId", userId] },
                    { $eq: ["$_id", "$$receiverId"] },
                    { $eq: ["$_id", "$$senderId"] }
                  ]
                }
              }
            },
            { $project: { firstName: 1, lastName: 1, role: 1 } }
          ],
          as: "otherParty"
        }
      },
      { $unwind: { path: "$otherParty", preserveNullAndEmptyArrays: true } },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Threads"),
      data: threads,
    });
  });

  /** Get total unread messages count. */
  getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const unreadCount = await Message.countDocuments({
      receiverId: req.user!._id,
      isRead: false,
      isDeleted: false,
    });
    ApiResponse.success(res, {
      message: MESSAGES.FETCHED("Unread Count"),
      data: { unreadCount },
    });
  });
}

export const notificationController = new NotificationController();
export const announcementController = new AnnouncementController();
export const messageController = new MessageController();
