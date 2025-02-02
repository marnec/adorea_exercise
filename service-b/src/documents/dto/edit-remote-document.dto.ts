import { IsNotEmpty } from "class-validator";
import { ServiceAAuthDto } from "src/serviceA/service-a-auth.dto";

export class EditRemoteDocumentDto {
    @IsNotEmpty()
    title: string
}