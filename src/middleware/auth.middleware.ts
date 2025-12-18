import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';

// if app-lication is a club
// A middleware acts as a bouncer between requests and controller
// meaning only authorized requests are sent to the controller to get response
// unauthorixed requests are those which dont have a valid auuth header attached to it

interface JwtPayload{
    id: string;
    role: string;
};

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
)=>{
    const authHeader = req.headers.authorization; // gets the token from the headers
    if (!authHeader || !authHeader.startsWith("Bearer ")) { // validates if auth header exists 
        return res.status(401).json({message: "No Token Provided"})
    };

    const token = authHeader.split(" ")[1];

    try {
        const decoded =jwt.verify(
            token,
            process.env.JWT_SECRET_TOKEN!
        )as JwtPayload;

        (req as any).user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}