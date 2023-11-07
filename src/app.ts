import express,{Request,Response,NextFunction, ErrorRequestHandler, Application} from 'express'
import {Server} from 'http'
import createHttpError from 'http-errors';
import {config} from 'dotenv'
import {google} from 'googleapis'
import dayjs from 'dayjs'

config()

const app: Application=express()

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );

const calendar = google.calendar({
    version: 'v3',
    auth: oauth2Client,
  });

  


const scopes = [
    'https://www.googleapis.com/auth/calendar'
  ];


console.log(oauth2Client)
app.get('/google',(req: Request,res: Response,next: NextFunction)=>{

    if (oauth2Client.credentials && oauth2Client.credentials.access_token) {
        // User is already authenticated, redirect or show a "Logged In" message.
        res.send("You are already logged in.");
    }
    else{
        const url = oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
            access_type: 'offline',
        
            // If you only need one scope you can pass it as a string
            scope: scopes
        });
        res.redirect(url)
    }

});



app.get('/google/redirect', async (req: Request,res: Response,next: NextFunction)=>{
    const code: string | string[] | undefined = req.query.code as string;

    if (oauth2Client.credentials && oauth2Client.credentials.access_token) {
        // User is already authenticated, redirect or show a "Logged In" message.
        res.send("You are already logged in.");
        console.log("cvbnm,")
    }
    else{

        if (!code) {
            return res.status(400).json({ error: 'Authorization code missing in query parameters' });
        }
        try {
            // This will provide an object with the access_token and refresh_token.
            // Save these somewhere safe so they can be used at a later time.
            const {tokens} = await oauth2Client.getToken(code)
            oauth2Client.setCredentials(tokens);
            console.log(oauth2Client)
            res.send("Logged In Successfully");
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'An error occurred while handling the OAuth2 flow' });
        }
    }
});



  app.get('/schedule_event', async (req: Request,res: Response,next: NextFunction)=>{

    await calendar.events.insert({
        calendarId: "primary",
        auth:oauth2Client,
        requestBody:{
            summary: "Meet with",
            description:"description",
            start:{
                dateTime:  dayjs(new Date()).add(1, 'day').toISOString(),
                timeZone: "Asia/Kolkata",
            },
            end:{
                dateTime:  dayjs(new Date()).add(1, 'day').add(1,'hour').toISOString(),
                timeZone: "Asia/Kolkata",
            }
        }
    });

    res.send("scheduled")

  });


  
app.use((req: Request,res: Response,next: NextFunction)=>{
    next(new createHttpError.NotFound())
});

const errorHandler:ErrorRequestHandler=(err,req,res,next)=>{
res.status(err.status || 500)
res.send({
    status: err.status || 500,
    message: err.message, 
})

}

app.use(errorHandler)

const PORT: Number = Number(process.env.PORT) || 3000

const server: Server = app.listen(PORT,()=>{
 console.log("Server started")
});