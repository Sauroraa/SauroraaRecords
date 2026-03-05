import { Controller, Get, Query } from "@nestjs/common";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { SearchService } from "./search.service";

class SearchQueryDto {
  @IsString()
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query() query: SearchQueryDto) {
    const items = await this.searchService.searchReleases(query.q, query.limit ?? 20);
    return {
      query: query.q,
      count: items.length,
      items
    };
  }
}
