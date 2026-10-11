"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCrawlStatusDto = exports.GetCrawlStatusSchema = exports.CrawlSiteDto = exports.CrawlSiteSchema = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
exports.CrawlSiteSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    url: zod_1.z.string().trim().url('Please provide a valid URL'),
});
class CrawlSiteDto extends (0, nestjs_zod_1.createZodDto)(exports.CrawlSiteSchema) {
}
exports.CrawlSiteDto = CrawlSiteDto;
exports.GetCrawlStatusSchema = zod_1.z.object({
    tenant_id: zod_1.z.string().min(1, 'Tenant ID is required'),
    job_id: zod_1.z.string().min(1, 'Job ID is required'),
});
class GetCrawlStatusDto extends (0, nestjs_zod_1.createZodDto)(exports.GetCrawlStatusSchema) {
}
exports.GetCrawlStatusDto = GetCrawlStatusDto;
