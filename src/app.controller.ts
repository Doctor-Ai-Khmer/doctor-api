import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';

@Controller()
export class AppController {
  @Get()
  serveHtml(@Res() res: Response) {
    return res.sendFile(path.join(__dirname, '..', 'index.html'));
  }
}
