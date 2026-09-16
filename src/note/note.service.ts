import {
  ConsoleLogger,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NoteService {
  private readonly noteLogger = new ConsoleLogger(NoteService.name);
  constructor(private readonly prismaService: PrismaService) {}

  async create(createNoteDto: CreateNoteDto, userId: number) {
    const newNote = await this.prismaService.note.create({
      data: {
        title: createNoteDto.title,
        body: createNoteDto.body,
        userId: userId,
      },
    });
    this.noteLogger.log(`Note created with id: ${newNote.id}`);
    return newNote;
  }

  async findAll(
    { take, skip }: { take?: number; skip?: number },
    userId: number,
  ) {
    const userNotes = await this.prismaService.note.findMany({
      where: {
        userId: userId,
      },
      take: take,
      skip: skip,
    });
    this.noteLogger.log(
      `Found ${userNotes.length} notes for user with id: ${userId}`,
    );
    return userNotes;
  }

  async findOne(id: number, userId: number) {
    const note = await this.prismaService.note.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        title: true,
        body: true,
        userId: true,
      },
    });
    if (!note) {
      throw new NotFoundException(`Note not found`);
    }
    if (note.userId !== userId) {
      throw new ForbiddenException(`Not Allowed to access this note`);
    }
    this.noteLogger.log(`Found note with id: ${id}`);
    return {
      id: note.id,
      title: note.title,
      body: note.body,
    };
  }

  async update(id: number, updateNoteDto: UpdateNoteDto, userId: number) {
    const note = await this.prismaService.note.findUnique({
      where: {
        id: id,
      },
    });
    if (!note) {
      throw new NotFoundException(`Note not found`);
    }
    if (note.userId !== userId) {
      throw new ForbiddenException(`Not Allowed to access this note`);
    }
    const updatedNote = await this.prismaService.note.update({
      where: {
        id: id,
      },
      data: updateNoteDto,
    });
    this.noteLogger.log(`Updated note with id: ${id}`);
    return updatedNote;
  }

  async remove(id: number, userId: number) {
    const note = await this.prismaService.note.findUnique({
      where: {
        id: id,
      },
    });
    if (!note) {
      throw new NotFoundException(`Note not found`);
    }
    if (note.userId !== userId) {
      throw new ForbiddenException(`Not Allowed to access this note`);
    }
    await this.prismaService.note.delete({
      where: {
        id: id,
      },
    });
    this.noteLogger.log(
      `Deleted note with id: ${id} deleted by user with id: ${userId}`,
    );
    return { message: `Note deleted successfully` };
  }
}
