import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/auth-guard";
import Analytics from "@/models/Analytics";
import Project from "@/models/Project";
import Skill from "@/models/Skill";
import Experience from "@/models/Experience";

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      await connectDB();

      const totalProjects = await Project.countDocuments();
      const totalSkills = await Skill.countDocuments();
      const totalExperience = await Experience.countDocuments();

      const totalViews = await Analytics.aggregate([
        { $group: { _id: null, total: { $sum: "$views" } } },
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayViews = await Analytics.aggregate([
        { $match: { date: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: "$views" } } },
      ]);

      // Last 30 days views
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const viewsOverTime = await Analytics.aggregate([
        { $match: { date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            views: { $sum: "$views" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Views per page
      const viewsPerPage = await Analytics.aggregate([
        { $group: { _id: "$page", views: { $sum: "$views" } } },
        { $sort: { views: -1 } },
      ]);

      return NextResponse.json({
        success: true,
        data: {
          totalProjects,
          totalSkills,
          totalExperience,
          totalViews: totalViews[0]?.total || 0,
          todayViews: todayViews[0]?.total || 0,
          viewsOverTime: viewsOverTime.map((v: { _id: string; views: number }) => ({
            date: v._id,
            views: v.views,
          })),
          viewsPerPage: viewsPerPage.map((v: { _id: string; views: number }) => ({
            page: v._id,
            views: v.views,
          })),
        },
      });
    } catch {
      return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 });
    }
  });
}
