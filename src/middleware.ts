import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const userMiddleware = (req: any, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1]; 
    if (!token) return res.status(403).json({ message: "Token missing" });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      req.userId = decoded.userId;
      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  };
  
  export default userMiddleware;