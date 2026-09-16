import {
  ConflictException,
  ConsoleLogger,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
@Injectable()
export class AuthService {
  private readonly authServiceLogger = new ConsoleLogger(AuthService.name);
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}
  async register(registerData: RegisterDto) {
    const user = await this.userService.getUserByEmail(registerData.email);
    if (user) {
      throw new ConflictException('Email already in use');
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerData.password, saltRounds);
    const newUser = await this.userService.createUser({
      ...registerData,
      password: hashedPassword,
    });
    this.authServiceLogger.log(`User registered with id: ${newUser.id}`);
    const payload = { sub: newUser.id, email: newUser.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async login(loginData: LoginDto) {
    const user = await this.userService.getUserByEmail(loginData.email);
    if (!user) {
      throw new UnauthorizedException('Incorrect email or password');
    }
    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect email or password');
    }
    this.authServiceLogger.log(`User logged in with id: ${user.id}`);
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
