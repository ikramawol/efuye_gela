import { NextApiRequest, NextApiResponse } from "next";
import { getAllUsers } from "@/lib/auth.controller";

export default async function GET(req: NextApiRequest, res: NextApiResponse){
    const result = await getAllUsers()
    if (result.success){
        return res.status(200).json({
            success: true,
            data: result.data,
            // pagination: result.pagination
        })
    } else {
        return res.status(500).json({
            success: false,
            error: result.error
        })
    }

}