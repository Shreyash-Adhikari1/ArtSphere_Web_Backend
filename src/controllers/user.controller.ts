import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { LoginUserDTO, RegisterUserDTO, EditUserDTO } from "../dtos/user.dto";

const userService = new UserService();


export class userController{
    registerUser = async (req: Request, res: Response)=>{
        try{
            const registerDetailsParsed = RegisterUserDTO.safeParse(req.body);

        if (!registerDetailsParsed.success){
            return res.status(400).json({messaeg: "Registration Failed"})
        }

        const user = await userService.createUser(registerDetailsParsed.data);
        return res.status(201).json({message: "User registration Successful", user});
        }
        catch(error:any){ // Handling unknown errors
            return res.status(400).json({message: error.message || "User Registration Failed"})
        }
        
    };

    loginUser = async (req: Request, res: Response)=>{
        const loginDetailsParsed = LoginUserDTO.safeParse(req.body);

        try {
            if (!loginDetailsParsed.success) {
                return res.status(401).json({message: "Invalid Credentials", error: parsed.error});
            }

            const 
        } catch (error) {
            
        }
    };
    getProfile = async(req: Request, res: Response)=>{};
    editProfile = async (req: Request, res: Response)=>{};
    deleteUser = async (req: Request, res: Response)=>{};

}
