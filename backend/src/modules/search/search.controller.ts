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
    const result = await this.searchService.searchAll(query.q, query.limit ?? 10);
    return {
      query: query.q,
      releases: result.releases,
      artists: result.artists,
      count: result.releases.length,
      items: result.releases
    };
  }
}
